# Stripe Subscription Implementation Plan

## Overview

This document provides a comprehensive, step-by-step implementation plan for integrating Stripe subscriptions into the T3 chat application. The plan follows the "single source of truth" architecture with Stripe as the authoritative source for subscription data.

## Prerequisites Checklist

Before starting implementation, ensure these are completed:

- [ ] **Stripe Account Setup**
  - [ ] Stripe account created and verified
  - [ ] Test mode enabled for development
  - [ ] API keys obtained (publishable and secret)
  - [ ] Stripe CLI installed locally

- [ ] **Development Environment**
  - [ ] Project dependencies installed (`npm install` or `pnpm install`)
  - [ ] Convex development environment running (`npx convex dev`)
  - [ ] Next.js development server working (`npm run dev`)
  - [ ] Clerk authentication functional

- [ ] **Required Tools**
  - [ ] Stripe CLI for webhook testing
  - [ ] Database management tools for Convex
  - [ ] TypeScript language server configured

## Phase 1: Environment and Schema Setup

### Step 1.1: Environment Variables Configuration

**Action**: Update `src/env.ts` with Stripe configuration

**⚠️ Critical Warning**: Never commit API keys to version control. Use `.env.local` for development.

```typescript
// src/env.ts - Add to server schema
STRIPE_SECRET_KEY: z.string(),
STRIPE_WEBHOOK_SECRET: z.string(),

// Add to client schema
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),

// Add to runtimeEnv
STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
```

**Create `.env.local` file**:
```env
# Stripe Test Keys (replace with your actual test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Leave empty for now, will be set in Phase 3
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Create `.env.example` file**:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### Step 1.2: Database Schema Extension

**Action**: Update `convex/schema.ts` to add Stripe-related tables

**⚠️ Warning**: This will require a schema migration. Backup your data if in production.

```typescript
// Add to convex/schema.ts
customers: defineTable({
  userId: v.id("users"),
  stripeCustomerId: v.string(),
  email: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("byUserId", ["userId"])
  .index("byStripeCustomerId", ["stripeCustomerId"]),

subscriptions: defineTable({
  userId: v.id("users"),
  stripeSubscriptionId: v.string(),
  stripeCustomerId: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("canceled"),
    v.literal("incomplete"),
    v.literal("incomplete_expired"),
    v.literal("past_due"),
    v.literal("trialing"),
    v.literal("unpaid")
  ),
  priceId: v.string(),
  tier: subscriptionTiers,
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  trialEnd: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("byUserId", ["userId"])
  .index("byStripeSubscriptionId", ["stripeSubscriptionId"])
  .index("byStripeCustomerId", ["stripeCustomerId"]),
```

**Testing**: Run `npx convex dev` and verify schema updates are applied without errors.

### Step 1.3: Stripe Client Configuration

**Action**: Create Stripe configuration file

**File**: `src/lib/stripe.ts`
```typescript
import Stripe from 'stripe';
import { env } from '@/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia', // Use latest API version
  typescript: true,
});

// Price ID mapping (update with your actual Stripe price IDs)
export const PRICE_IDS = {
  PREMIUM_MONTHLY: 'price_xxxxxxxxx', // Replace with actual price ID
  PREMIUM_YEARLY: 'price_xxxxxxxxx',  // Replace with actual price ID
} as const;

// Tier mapping function
export function mapPriceIdToTier(priceId: string): "free" | "premium-level-1" {
  switch (priceId) {
    case PRICE_IDS.PREMIUM_MONTHLY:
    case PRICE_IDS.PREMIUM_YEARLY:
      return "premium-level-1";
    default:
      return "free";
  }
}
```

## Phase 2: Core Convex Functions

### Step 2.1: Customer Management Functions

**Action**: Create customer management functions in Convex

**File**: `convex/stripe.ts`

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import Stripe from 'stripe';

// Initialize Stripe (use environment variable)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export const getOrCreateStripeCustomer = mutation({
  args: { 
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check if customer already exists in Convex
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique();
      
    if (existingCustomer) {
      return {
        customerId: existingCustomer.stripeCustomerId,
        isNew: false
      };
    }
    
    // Create new Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: args.email,
      name: args.name,
      metadata: { 
        userId: args.userId,
        source: 't3-chat-app'
      },
    });
    
    // Store in Convex
    await ctx.db.insert("customers", {
      userId: args.userId,
      stripeCustomerId: stripeCustomer.id,
      email: args.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return {
      customerId: stripeCustomer.id,
      isNew: true
    };
  },
});
```

**⚠️ Important**: This function should only be called from authenticated contexts.

### Step 2.2: Subscription Sync Function

**Action**: Implement the core sync function following Theo's pattern

```typescript
// Add to convex/stripe.ts
export const syncStripeSubscription = mutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Fetch latest subscription from Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: args.stripeCustomerId,
        limit: 1,
        status: "all",
        expand: ["data.default_payment_method"],
      });
      
      // Get user from customer mapping
      const customer = await ctx.db
        .query("customers")
        .withIndex("byStripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
        .unique();
        
      if (!customer) {
        throw new Error(`Customer not found for Stripe customer ID: ${args.stripeCustomerId}`);
      }
      
      if (subscriptions.data.length === 0) {
        // No active subscription - set to free tier
        await updateUserTier(ctx, customer.userId, "free");
        
        // Remove any existing subscription records
        const existingSub = await ctx.db
          .query("subscriptions")
          .withIndex("byStripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
          .unique();
          
        if (existingSub) {
          await ctx.db.delete(existingSub._id);
        }
        
        return { tier: "free", status: "no_subscription" };
      }
      
      const subscription = subscriptions.data[0];
      const tier = mapPriceIdToTier(subscription.items.data[0].price.id);
      
      // Prepare subscription data
      const subData = {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: args.stripeCustomerId,
        userId: customer.userId,
        status: subscription.status as any, // Type assertion for Convex schema
        priceId: subscription.items.data[0].price.id,
        tier,
        currentPeriodStart: subscription.current_period_start * 1000, // Convert to milliseconds
        currentPeriodEnd: subscription.current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? subscription.trial_end * 1000 : undefined,
        updatedAt: Date.now(),
      };
      
      // Update or create subscription record
      const existingSub = await ctx.db
        .query("subscriptions")
        .withIndex("byStripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
        .unique();
        
      if (existingSub) {
        await ctx.db.patch(existingSub._id, subData);
      } else {
        await ctx.db.insert("subscriptions", {
          ...subData,
          createdAt: Date.now(),
        });
      }
      
      // Update user tier
      await updateUserTier(ctx, customer.userId, tier);
      
      return subData;
    } catch (error) {
      console.error('Error syncing subscription:', error);
      throw new Error(`Failed to sync subscription: ${error.message}`);
    }
  },
});

// Helper function to update user tier
async function updateUserTier(
  ctx: any, 
  userId: string, 
  tier: "free" | "premium-level-1"
) {
  const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("tokenIdentifier"), userId))
    .unique();
    
  if (user) {
    await ctx.db.patch(user._id, { tier });
  }
}

// Helper function to map price IDs to tiers
function mapPriceIdToTier(priceId: string): "free" | "premium-level-1" {
  // Define your price ID mappings here
  const priceToTierMap: Record<string, "free" | "premium-level-1"> = {
    'price_premium_monthly': 'premium-level-1',
    'price_premium_yearly': 'premium-level-1',
    // Add your actual Stripe price IDs here
  };
  
  return priceToTierMap[priceId] || "free";
}
```

**⚠️ Critical**: Update the `mapPriceIdToTier` function with your actual Stripe price IDs.

### Step 2.3: Checkout Session Creation

**Action**: Create function to generate checkout sessions

```typescript
// Add to convex/stripe.ts
export const createCheckoutSession = mutation({
  args: { 
    priceId: v.string(),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Get or create Stripe customer
    const { customerId } = await getOrCreateStripeCustomer(ctx, {
      userId: args.userId,
      email: args.email,
      name: args.name,
    });
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: args.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: args.userId,
        },
      },
    });
    
    return { 
      url: session.url,
      sessionId: session.id 
    };
  },
});
```

**⚠️ Note**: Add `NEXT_PUBLIC_APP_URL` to your environment variables.

## Phase 3: API Routes Setup

### Step 3.1: Checkout API Route

**Action**: Create Next.js API route for checkout

**File**: `src/app/api/stripe/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { priceId } = await request.json();
    
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 });
    }
    
    // Get Clerk user details
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    
    if (!token) {
      return NextResponse.json({ error: 'Unable to get auth token' }, { status: 401 });
    }
    
    // Get user from Clerk (you might need to adjust this based on your setup)
    const userEmail = 'user@example.com'; // Replace with actual user email retrieval
    const userName = 'User Name'; // Replace with actual user name retrieval
    
    // Create checkout session via Convex
    const result = await fetchMutation(
      api.stripe.createCheckoutSession,
      {
        priceId,
        userId,
        email: userEmail,
        name: userName,
      },
      { token }
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**⚠️ Important**: Update user email/name retrieval logic based on your Clerk setup.

### Step 3.2: Webhook Handler

**Action**: Create webhook handler for Stripe events

**File**: `src/app/api/stripe/webhooks/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');
  
  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 400 }
    );
  }
  
  console.log(`Received webhook: ${event.type}`);
  
  try {
    await processStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processStripeEvent(event: Stripe.Event) {
  // Note: For webhook processing, we need to use a system token or handle auth differently
  // This is a simplified version - you may need to adjust based on your auth setup
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentSucceeded(invoice);
      break;
      
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(failedInvoice);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.customer) {
    // Use fetchMutation with system auth - you'll need to set this up
    await fetchMutation(
      api.stripe.syncStripeSubscription,
      { stripeCustomerId: session.customer as string }
      // Note: You'll need to handle auth for webhook contexts
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  await fetchMutation(
    api.stripe.syncStripeSubscription,
    { stripeCustomerId: subscription.customer as string }
    // Note: You'll need to handle auth for webhook contexts
  );
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payment logic
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment logic
  console.log('Payment failed for invoice:', invoice.id);
}
```

**⚠️ Critical**: The webhook handler needs special authentication handling. You may need to create a system token or use a different auth pattern for webhooks.

### Step 3.3: Customer Portal Route

**Action**: Create customer portal access route

**File**: `src/app/api/stripe/portal/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    
    // Get customer from Convex
    const customer = await fetchQuery(
      api.customers.getByUserId,
      { userId },
      { token }
    );
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Phase 4: Frontend Components

### Step 4.1: Subscription Hook

**Action**: Create React hook for subscription management

**File**: `src/hooks/useSubscription.ts`

```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function useSubscription() {
  const { user } = useUser();
  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    user ? { userId: user.id } : "skip"
  );
  
  return {
    subscription,
    isLoading: subscription === undefined,
    tier: subscription?.tier || "free",
    isActive: subscription?.status === "active",
    isPremium: subscription?.tier === "premium-level-1",
    trialEndsAt: subscription?.trialEnd,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
  };
}
```

**⚠️ Note**: You'll need to create the `api.subscriptions.getUserSubscription` query in Convex.

### Step 4.2: Pricing Components

**Action**: Create pricing table and upgrade components

**File**: `src/components/PricingTable.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useUser } from "@clerk/nextjs";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    tier: "free" as const,
    price: "$0",
    interval: "forever",
    features: [
      "100 messages/month",
      "Basic AI models",
      "Standard support",
    ],
    cta: "Current Plan",
    popular: false,
  },
  {
    name: "Premium",
    tier: "premium-level-1" as const,
    price: "$9.99",
    interval: "month",
    priceId: "price_premium_monthly", // Replace with actual price ID
    features: [
      "Unlimited messages",
      "Advanced AI models (GPT-4, Claude)",
      "Priority support",
      "Export conversations",
      "Custom prompts",
    ],
    cta: "Upgrade to Premium",
    popular: true,
  },
];

export function PricingTable() {
  const { tier, isLoading } = useSubscription();
  const { user } = useUser();
  
  const handleUpgrade = async (priceId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };
  
  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
    }
  };
  
  if (isLoading) {
    return <div>Loading pricing...</div>;
  }
  
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <Card key={plan.tier} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
          {plan.popular && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              Most Popular
            </Badge>
          )}
          
          <CardHeader>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <div className="text-3xl font-bold">
              {plan.price}
              {plan.interval !== 'forever' && (
                <span className="text-lg font-normal text-muted-foreground">
                  /{plan.interval}
                </span>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            {tier === plan.tier ? (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
                {tier === "premium-level-1" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={handleManageSubscription}
                  >
                    Manage Subscription
                  </Button>
                )}
              </div>
            ) : (
              plan.priceId && (
                <Button 
                  onClick={() => handleUpgrade(plan.priceId!)}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Step 4.3: Subscription Status Components

**Action**: Create components to display subscription status

**File**: `src/components/SubscriptionBanner.tsx`

```typescript
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown, Calendar } from "lucide-react";

export function SubscriptionBanner() {
  const { subscription, tier, currentPeriodEnd, cancelAtPeriodEnd } = useSubscription();
  
  // Free tier prompt
  if (tier === "free") {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Crown className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>You're on the free plan. Upgrade for unlimited access!</span>
          <Button size="sm" asChild>
            <a href="/pricing">Upgrade Now</a>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Subscription ending warning
  if (cancelAtPeriodEnd && currentPeriodEnd) {
    const endDate = new Date(currentPeriodEnd).toLocaleDateString();
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Your subscription will end on {endDate}</span>
          <Button size="sm" variant="outline" asChild>
            <a href="/pricing">Reactivate</a>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Active subscription status
  if (tier === "premium-level-1" && currentPeriodEnd) {
    const renewDate = new Date(currentPeriodEnd).toLocaleDateString();
    return (
      <Alert className="border-green-200 bg-green-50">
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          Premium subscription active • Renews on {renewDate}
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
```

## Phase 5: Testing and Validation

### Step 5.1: Local Development Setup

**Action**: Set up local testing environment

```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Stripe webhook forwarding
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Terminal 3: Start Next.js
npm run dev
```

**⚠️ Important**: Copy the webhook signing secret from the Stripe CLI output and add it to your `.env.local` file.

### Step 5.2: Test Scenarios

**Manual Testing Checklist**:

- [ ] **User Registration**
  - [ ] Sign up with Clerk
  - [ ] Verify user created in Convex
  - [ ] Check initial tier is "free"

- [ ] **Subscription Creation**
  - [ ] Navigate to pricing page
  - [ ] Click upgrade button
  - [ ] Complete Stripe checkout with test card: `4242424242424242`
  - [ ] Verify webhook received
  - [ ] Check subscription created in Convex
  - [ ] Verify user tier updated to "premium-level-1"

- [ ] **Subscription Management**
  - [ ] Access customer portal
  - [ ] Cancel subscription
  - [ ] Verify cancellation webhook
  - [ ] Check `cancelAtPeriodEnd` flag

- [ ] **Real-time Updates**
  - [ ] Make subscription change in Stripe dashboard
  - [ ] Verify webhook updates Convex
  - [ ] Check UI updates automatically

### Step 5.3: Error Handling Tests

**Test Error Scenarios**:

- [ ] Invalid price ID in checkout
- [ ] Webhook signature verification failure
- [ ] Network timeout during Stripe API calls
- [ ] User not found scenarios
- [ ] Duplicate customer creation attempts

### Step 5.4: Usage Limits Testing

**Action**: Test subscription-based usage limits

**Add to existing usage checking logic**:

```typescript
// Test usage limits for different tiers
// Free: 100 messages/month
// Premium: Unlimited
```

## Phase 6: Production Deployment

### Step 6.1: Stripe Production Setup

**Action**: Configure Stripe for production

**⚠️ Critical**: Never use test keys in production

1. **Switch to Stripe Live Mode**
2. **Create Production Products and Prices**
3. **Update Price IDs in code**
4. **Configure Live Webhooks**
5. **Update Environment Variables**

### Step 6.2: Environment Variables for Production

```env
# Production Environment Variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### Step 6.3: Webhook Endpoint Configuration

**Action**: Configure production webhook endpoint

1. Go to Stripe Dashboard → Webhooks
2. Create endpoint: `https://your-domain.com/api/stripe/webhooks`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Step 6.4: Monitoring and Alerting

**Action**: Set up production monitoring

**Recommended Tools**:
- Stripe Dashboard for payment monitoring
- Convex Dashboard for database monitoring
- Application logs for error tracking
- Uptime monitoring for webhook endpoint

## Important Caveats and Warnings

### 🚨 Critical Security Considerations

1. **Never expose secret keys client-side**
2. **Always verify webhook signatures**
3. **Implement proper CSRF protection**
4. **Use HTTPS in production**
5. **Sanitize all user inputs**

### ⚠️ Data Consistency Warnings

1. **Webhook idempotency**: Handle duplicate webhook events
2. **Race conditions**: Use Convex transactions properly  
3. **Fallback sync**: Implement manual sync for failed webhooks
4. **Error recovery**: Plan for partial failures

### 🔧 Development Best Practices

1. **Test with multiple browsers and devices**
2. **Use Stripe's test card numbers for different scenarios**
3. **Test webhook failure scenarios**
4. **Implement comprehensive error logging**
5. **Monitor webhook delivery success rates**

### 💡 Performance Considerations

1. **Cache subscription data appropriately**
2. **Minimize Stripe API calls**
3. **Use Convex real-time updates efficiently**
4. **Implement proper loading states**
5. **Handle network timeouts gracefully**

## Troubleshooting Guide

### Common Issues and Solutions

**Issue**: Webhook signature verification fails
**Solution**: Ensure webhook secret is correctly set and matches Stripe endpoint

**Issue**: Customer not found in Convex
**Solution**: Check user ID mapping and ensure customer creation was successful

**Issue**: Subscription not updating in real-time
**Solution**: Verify webhook processing and Convex mutations are working

**Issue**: Checkout session creation fails
**Solution**: Check Stripe API keys and customer creation logic

**Issue**: Price ID not recognized
**Solution**: Verify price IDs match between Stripe dashboard and code

## Next Steps

After completing this implementation plan:

1. **Test thoroughly** with the provided test scenarios
2. **Implement additional features** like:
   - Usage-based billing for AI tokens
   - Team subscriptions
   - Annual billing discounts
   - Promotional codes
3. **Monitor and optimize** based on user behavior
4. **Scale** by implementing:
   - Multiple subscription tiers
   - Add-on products
   - Enterprise features

The final document will provide the actual implementation scaffolding with working code examples.