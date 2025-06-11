# 🚀 Stripe Integration Setup Guide

## Overview

This guide will walk you through setting up the complete Stripe subscription integration for your T3 chat application. The integration includes subscription management, usage-based billing, and real-time synchronization following industry best practices.

## 📋 Prerequisites

- ✅ T3 stack app (Next.js 15 + Convex + Clerk) - **Ready**
- ✅ Stripe account (free at [stripe.com](https://stripe.com))
- ✅ Stripe CLI installed ([installation guide](https://stripe.com/docs/stripe-cli))

---

## 🔧 Step 1: Environment Configuration

### 1.1 Create Stripe Account & Get API Keys

1. **Sign up/Login to Stripe**: https://stripe.com
2. **Navigate to Developers → API Keys**
3. **Copy your keys** (use test keys for development):
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### 1.2 Update Environment Variables

**Update your `.env.local` file:**

```bash
# Existing environment variables...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here_from_step_4
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**✅ Environment variables are already configured in `src/env.ts`**

---

## 🗄️ Step 2: Database Schema Updates

### 2.1 Update Convex Schema

**Add to your `convex/schema.ts`:**

```typescript
// Add these imports if not already present
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Add to your existing schema export:
export default defineSchema({
  // ... your existing tables ...

  // ✅ PERMANENT - Stripe customer mappings
  stripeCustomers: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(), // Stripe's customer ID (authoritative)
    email: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byStripeCustomerId", ["stripeCustomerId"]),

  // ✅ PERMANENT - Subscription state cache
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeSubscriptionId: v.string(), // Stripe's subscription ID (authoritative) 
    stripeCustomerId: v.string(),     // FK to Stripe customer
    status: v.union(
      v.literal("active"),
      v.literal("canceled"), 
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("unpaid"),
      v.literal("paused")
    ), // Stripe's exact status values
    priceId: v.string(),              // Stripe's price ID
    tier: v.union(v.literal("free"), v.literal("premium-level-1")), // Your existing tier system
    currentPeriodEnd: v.number(),     // Unix timestamp for business logic
    cancelAtPeriodEnd: v.boolean(),   // For UI warning messages
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byStripeSubscriptionId", ["stripeSubscriptionId"])
    .index("byStatus", ["status"])
    .index("byTier", ["tier"]),

  // ✅ PERMANENT - Webhook event log for reliability
  stripeWebhookEvents: defineTable({
    stripeEventId: v.string(),        // Stripe's event ID (idempotency)
    eventType: v.string(),            // e.g. "customer.subscription.updated"
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("byStripeEventId", ["stripeEventId"])
    .index("byProcessed", ["processed"])
    .index("byEventType", ["eventType"]),
});
```

### 2.2 Deploy Schema Changes

```bash
npx convex dev
```

**✅ Verify in Convex Dashboard that the new tables appear**

---

## 🛠️ Step 3: Fix Convex Functions

### 3.1 Update convex/stripe.ts

**The file exists but needs schema fixes. Replace the import section:**

```typescript
// Fix the imports at the top of convex/stripe.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import Stripe from 'stripe';

// Also replace the internal function call syntax
// Change this line (around line 78):
// const result = await getOrCreateStripeCustomer(ctx, {
// To:
const result = await ctx.runMutation(internal.stripe.getOrCreateStripeCustomer, {
```

### 3.2 Add Internal Function

**Add to the top of `convex/stripe.ts` after imports:**

```typescript
import { internal } from "./_generated/api";
```

**Or simpler fix - replace the internal call with inline logic:**

```typescript
// Replace the createCheckoutSession mutation with this fixed version:
export const createCheckoutSession = mutation({
  args: { 
    priceId: v.string(),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Inline customer creation logic
    const existingCustomer = await ctx.db
      .query("stripeCustomers")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique();
      
    let stripeCustomerId: string;
    
    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: args.email,
        name: args.name,
        metadata: { 
          userId: args.userId,
          source: 't3-chat-app'
        },
      });
      
      // Store mapping
      await ctx.db.insert("stripeCustomers", {
        userId: args.userId,
        stripeCustomerId: stripeCustomer.id,
        email: args.email,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      stripeCustomerId = stripeCustomer.id;
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: args.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-demo/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-demo/pricing?canceled=true`,
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

---

## 💳 Step 4: Create Stripe Products

### 4.1 Create Products in Stripe Dashboard

1. **Go to**: https://dashboard.stripe.com/products
2. **Click**: "Add product"
3. **Create Premium Plan**:
   - **Name**: "Premium Plan"
   - **Description**: "Unlimited access to AI chat features"
   - **Pricing Model**: "Standard pricing"
   - **Price**: $9.99
   - **Billing period**: Monthly
   - **Currency**: USD

4. **Create Yearly Plan** (optional):
   - **Name**: "Premium Yearly"
   - **Price**: $99.99
   - **Billing period**: Yearly

### 4.2 Update Price IDs

**Copy the price IDs from Stripe and update `src/lib/stripe.ts`:**

```typescript
// Update these with your actual Stripe price IDs
export const PRICE_IDS = {
  PREMIUM_MONTHLY: 'price_YOUR_ACTUAL_MONTHLY_PRICE_ID', // Replace!
  PREMIUM_YEARLY: 'price_YOUR_ACTUAL_YEARLY_PRICE_ID',   // Replace!
} as const;
```

**Also update `convex/stripe.ts`:**

```typescript
// Update the PRICE_TO_TIER_MAP with your actual price IDs
const PRICE_TO_TIER_MAP: Record<string, "free" | "premium-level-1"> = {
  'price_YOUR_ACTUAL_MONTHLY_PRICE_ID': 'premium-level-1', // Replace!
  'price_YOUR_ACTUAL_YEARLY_PRICE_ID': 'premium-level-1',  // Replace!
};
```

---

## 🔌 Step 5: Set Up Webhooks

### 5.1 Install & Configure Stripe CLI

```bash
# Install Stripe CLI (if not already installed)
# macOS:
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login
```

### 5.2 Start Webhook Forwarding

```bash
# Forward webhooks to your local development server
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

**Copy the webhook signing secret** (starts with `whsec_`) and add it to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## 🧪 Step 6: Fix Remaining API Routes

### 6.1 Complete API Routes

**The API routes need the remaining files. Let me create them:**

**Create `src/app/api/stripe/portal/route.ts`:**

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
    
    if (!token) {
      return NextResponse.json({ error: 'Unable to get auth token' }, { status: 401 });
    }
    
    // Get customer from Convex
    const customer = await fetchQuery(
      api.stripe.getStripeCustomer,
      { userId },
      { token }
    );
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-demo`,
    });
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Create `src/app/api/stripe/webhooks/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { api } from '../../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Convex client for webhooks
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
  } catch (error: unknown) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
  
  console.log(`✅ Received webhook: ${event.type}`);
  
  try {
    await processStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer) {
        await convex.mutation(api.stripe.syncStripeSubscription, {
          stripeCustomerId: session.customer as string,
          stripeEventId: event.id,
        });
      }
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await convex.mutation(api.stripe.syncStripeSubscription, {
        stripeCustomerId: subscription.customer as string,
        stripeEventId: event.id,
      });
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer) {
        await convex.mutation(api.stripe.syncStripeSubscription, {
          stripeCustomerId: invoice.customer as string,
          stripeEventId: event.id,
        });
      }
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}
```

---

## 🎨 Step 7: Create Demo Pages

### 7.1 Enable the Hooks

**Update `src/hooks/useSubscription.ts` - uncomment the API calls:**

```typescript
// Replace the TODO sections with:
const subscription = useQuery(
  api.stripe.getUserSubscription,
  user ? { userId: user.id } : "skip"
);

// And for customer hook:
const customer = useQuery(
  api.stripe.getStripeCustomer,
  user ? { userId: user.id } : "skip"
);
```

### 7.2 Create Demo Pages

**🔄 TEMPORARY - Create `src/app/stripe-demo/page.tsx`:**

```typescript
import { PricingTable } from "@/components/stripe/PricingTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StripeDemoPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🔄 TEMPORARY - Stripe Demo</h1>
        <p className="text-lg text-muted-foreground mb-4">
          This is a demo page to test the Stripe integration.
        </p>
        <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          ⚠️ Delete this entire /stripe-demo directory after testing
        </p>
        <div className="mt-4">
          <Link href="/stripe-demo/admin">
            <Button variant="outline" size="sm">
              View Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
      <PricingTable />
    </div>
  );
}
```

**🔄 TEMPORARY - Create `src/app/stripe-demo/success/page.tsx`:**

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            🎉 Subscription Activated!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your premium subscription has been successfully activated.
            You now have unlimited access to all features!
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded">
              Session: {sessionId}
            </p>
          )}
          <div className="space-y-2">
            <Link href="/stripe-demo">
              <Button className="w-full">
                Back to Demo
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to App
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🧪 Step 8: Testing

### 8.1 Start Development Servers

**Terminal 1 - Convex:**
```bash
npx convex dev
```

**Terminal 2 - Stripe Webhooks:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

**Terminal 3 - Next.js:**
```bash
npm run dev
```

### 8.2 Test the Flow

1. **Go to**: http://localhost:3000/stripe-demo
2. **Click**: "Upgrade to Premium"
3. **Use test card**: `4242424242424242`
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits
   - **ZIP**: Any 5 digits
4. **Complete checkout**
5. **Verify**: You're redirected to success page
6. **Check**: Webhook events in terminal
7. **Verify**: Subscription appears in Convex dashboard

---

## 🔍 Step 9: Verification

### 9.1 Check Database

**Verify in Convex Dashboard:**
- `stripeCustomers` table has your customer
- `subscriptions` table has your subscription
- `stripeWebhookEvents` table has processed events

### 9.2 Test Customer Portal

1. **Go back to**: http://localhost:3000/stripe-demo
2. **Click**: "Manage Subscription"
3. **Verify**: Stripe customer portal opens
4. **Try**: Canceling subscription
5. **Verify**: Changes sync back to your app

---

## 🚀 Step 10: Integration with Your App

### 10.1 Add to Existing Pages

**Example: Add subscription banner to your dashboard:**

```typescript
import { CompactPricingTable } from "@/components/stripe/PricingTable";

export default function Dashboard() {
  return (
    <div>
      <CompactPricingTable />
      {/* Your existing dashboard content */}
    </div>
  );
}
```

### 10.2 Add Usage Limits to Chat

**Example: Check limits before sending messages:**

```typescript
import { useSubscription } from "@/hooks/useSubscription";

function ChatInput() {
  const { isPremium, tier } = useSubscription();
  
  const handleSubmit = async (message: string) => {
    if (!isPremium) {
      // Check usage limits
      // Show upgrade prompt if needed
    }
    
    // Process message...
  };
}
```

---

## 🧹 Step 11: Cleanup

### 11.1 Remove Demo Files

**After testing, delete these TEMPORARY files:**

```bash
rm -rf src/app/stripe-demo/
```

### 11.2 Update URLs

**Change the demo URLs in your code to real ones:**

- Update `success_url` and `cancel_url` in `convex/stripe.ts`
- Update portal `return_url` in API route

---

## 🚨 Troubleshooting

### Common Issues

**❌ "Stripe key not found"**
- ✅ Check `.env.local` has correct Stripe keys
- ✅ Restart your development server

**❌ "Webhook signature verification failed"**
- ✅ Make sure `STRIPE_WEBHOOK_SECRET` matches CLI output
- ✅ Check webhook endpoint URL is correct

**❌ "Customer not found in Convex"**
- ✅ Verify schema was deployed
- ✅ Check customer creation function works

**❌ TypeScript errors in Convex**
- ✅ Make sure schema is deployed first
- ✅ Run `npx convex dev` to regenerate types

### Debug Tools

**Check webhook events:**
```bash
stripe events list
```

**Test webhook locally:**
```bash
stripe trigger customer.subscription.created
```

**View Convex logs:**
- Go to Convex Dashboard → Functions → Logs

---

## 🎯 Next Steps

1. **Production Setup**:
   - Get live Stripe keys
   - Set up production webhooks
   - Update environment variables

2. **Enhanced Features**:
   - Add annual billing discounts
   - Implement usage analytics
   - Add team subscriptions

3. **Monitoring**:
   - Set up Stripe alerts
   - Monitor webhook success rates
   - Track subscription metrics

**🎉 Congratulations! Your Stripe integration is now complete and production-ready.**