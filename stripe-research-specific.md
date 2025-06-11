# Stripe Subscription Implementation - T3 Stack Specific Research

## Overview

This document analyzes how to apply Stripe subscription patterns specifically to the T3 chat application tech stack: **Next.js 15 + Convex + Clerk + TypeScript + Stripe**. Based on analysis of the current project structure and integration patterns for this specific stack.

## Current Project Analysis

### Tech Stack Assessment
- **Frontend**: Next.js 15 with React 19 and App Router
- **Backend**: Convex (real-time database with RLS via convex-helpers)
- **Authentication**: Clerk (already integrated)
- **Styling**: Tailwind CSS + Radix UI components
- **AI Integration**: AI SDK v4 (stable) with OpenAI + Anthropic
- **Payment Processing**: Stripe (already in dependencies)

### Current Database Schema Analysis

From `convex/schema.ts`, the project already has:

```typescript
export const subscriptionTiers = v.union(
  v.literal("free"),
  v.literal("premium-level-1")
);

// Users table with tier field
users: defineTable({
  tokenIdentifier: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  tier: subscriptionTiers, // Already prepared for subscriptions!
  // ...
})

// Usage tracking already implemented
usages: defineTable({
  userId: v.id("users"),
  tokenCountTotal: v.number(),
  messagesCountTotal: v.number(),
  // ...
})
```

**Key Observations**:
- ✅ Subscription tiers already defined
- ✅ User tier tracking already in place  
- ✅ Usage tracking infrastructure exists
- ✅ RLS (Row Level Security) system already implemented
- ❌ Missing Stripe-specific tables (customers, subscriptions)

## T3 Stack Integration Patterns

### 1. Convex + Stripe Integration Strategy

**Convex-Specific Considerations**:
- Convex functions provide ACID transactions and real-time updates
- RLS system ensures data security without additional auth layers
- Server-side functions can handle Stripe API calls securely
- Built-in optimistic concurrency control handles race conditions

**Recommended Database Extensions**:

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

### 2. Next.js App Router + Stripe Patterns

**API Routes Structure**:
```
src/app/api/
├── stripe/
│   ├── checkout/
│   │   └── route.ts          # Create checkout sessions
│   ├── portal/
│   │   └── route.ts          # Customer portal access
│   ├── webhooks/
│   │   └── route.ts          # Webhook handler
│   └── sync/
│       └── route.ts          # Manual sync utility
```

**Authentication Integration**:
- Use Clerk's `auth()` helper in API routes
- Extract user ID from Clerk's JWT token
- Map Clerk user ID to Stripe customer ID

### 3. Clerk + Stripe Customer Mapping

**Pattern for User-Customer Relationship**:

```typescript
// In API routes, get authenticated user from Clerk
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get or create Stripe customer for this Clerk user
  const customer = await getOrCreateStripeCustomer(userId);
  // ...
}
```

**Clerk Webhook Integration**:
- Handle `user.created` webhook from Clerk
- Automatically create Stripe customer when user signs up
- Store the mapping in Convex

## Integration Architecture

### 1. Data Flow Architecture

```
User (Clerk Auth) -> Next.js API Route -> Convex Functions -> Stripe API
                                     ↓
Stripe Webhooks -> Next.js API Route -> Convex Functions -> Real-time Updates
```

**Key Benefits of This Flow**:
- Clerk handles authentication seamlessly
- Convex provides ACID transactions for data consistency
- Real-time updates push subscription changes to UI instantly
- RLS ensures users only see their own subscription data

### 2. Stripe Customer Creation Strategy

**Implementation Pattern**:

```typescript
// convex/stripe.ts
export const getOrCreateStripeCustomer = mutation({
  args: { 
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check if customer already exists
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique();
      
    if (existingCustomer) {
      return existingCustomer.stripeCustomerId;
    }
    
    // Create new Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: args.email,
      name: args.name,
      metadata: { userId: args.userId },
    });
    
    // Store in Convex
    await ctx.db.insert("customers", {
      userId: args.userId,
      stripeCustomerId: stripeCustomer.id,
      email: args.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return stripeCustomer.id;
  },
});
```

### 3. Subscription Sync Pattern (Theo's Single Source of Truth)

**Convex Function for Stripe Sync**:

```typescript
// convex/stripe.ts
export const syncStripeSubscription = mutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const subscriptions = await stripe.subscriptions.list({
      customer: args.stripeCustomerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method"],
    });
    
    if (subscriptions.data.length === 0) {
      // Handle no subscription case
      await updateUserTier(ctx, args.stripeCustomerId, "free");
      return { tier: "free" };
    }
    
    const subscription = subscriptions.data[0];
    const tier = mapPriceIdToTier(subscription.items.data[0].price.id);
    
    // Update subscription in Convex
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("byStripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .unique();
      
    const subData = {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: args.stripeCustomerId,
      status: subscription.status,
      tier,
      currentPeriodStart: subscription.current_period_start * 1000,
      currentPeriodEnd: subscription.current_period_end * 1000,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: Date.now(),
    };
    
    if (existingSub) {
      await ctx.db.patch(existingSub._id, subData);
    } else {
      await ctx.db.insert("subscriptions", {
        ...subData,
        userId: await getUserIdFromCustomerId(ctx, args.stripeCustomerId),
        createdAt: Date.now(),
      });
    }
    
    // Update user tier
    await updateUserTier(ctx, args.stripeCustomerId, tier);
    
    return subData;
  },
});
```

## T3 Stack Specific Implementation Details

### 1. Environment Variables Extension

**Add to `src/env.ts`**:

```typescript
// In server schema
STRIPE_SECRET_KEY: z.string(),
STRIPE_WEBHOOK_SECRET: z.string(),

// In client schema  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),

// In runtimeEnv
STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
```

### 2. Webhook Handler for App Router

**File: `src/app/api/stripe/webhooks/route.ts`**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    
    // Use Convex fetchMutation with Clerk token for authentication
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    
    await processStripeEvent(event, token);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 400 }
    );
  }
}

async function processStripeEvent(event: Stripe.Event, token: string) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await fetchMutation(api.stripe.handleCheckoutCompleted, {
        sessionId: session.id,
        customerId: session.customer as string,
      }, { token });
      break;
      
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await fetchMutation(api.stripe.syncStripeSubscription, {
        stripeCustomerId: subscription.customer as string,
      }, { token });
      break;
  }
}
```

### 3. Client-Side Subscription Components

**React Hook for Subscription Status**:

```typescript
// src/hooks/useSubscription.ts
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
    trialEndsAt: subscription?.trialEnd,
    currentPeriodEnd: subscription?.currentPeriodEnd,
  };
}
```

### 4. Pricing Table Component

**File: `src/components/PricingTable.tsx`**:

```typescript
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const plans = [
  {
    name: "Free",
    tier: "free" as const,
    price: "$0",
    features: ["100 messages/month", "Basic AI models"],
  },
  {
    name: "Premium",
    tier: "premium-level-1" as const,
    price: "$9.99",
    priceId: "price_xxxxx", // Your Stripe price ID
    features: ["Unlimited messages", "Advanced AI models", "Priority support"],
  },
];

export function PricingTable() {
  const { tier } = useSubscription();
  const createCheckout = useMutation(api.stripe.createCheckoutSession);
  
  const handleUpgrade = async (priceId: string) => {
    const { url } = await createCheckout({ priceId });
    window.location.href = url;
  };
  
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {plans.map((plan) => (
        <div key={plan.tier} className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold">{plan.name}</h3>
          <p className="text-2xl font-bold">{plan.price}</p>
          
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
          
          {tier !== plan.tier && plan.priceId && (
            <Button 
              onClick={() => handleUpgrade(plan.priceId)}
              className="w-full mt-4"
            >
              Upgrade to {plan.name}
            </Button>
          )}
          
          {tier === plan.tier && (
            <div className="mt-4 text-green-600 font-medium">
              Current Plan
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## AI Integration Considerations

### 1. Usage-Based Billing Integration

**Existing Usage Tracking Enhancement**:

```typescript
// Extend existing usages table for subscription limits
export const checkUsageLimit = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .unique();
      
    const usage = await ctx.db
      .query("usages")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .unique();
      
    // Check limits based on tier
    const limits = getTierLimits(user.tier);
    
    return {
      canSendMessage: usage.messagesCountSinceLastReset < limits.monthlyMessages,
      remainingMessages: limits.monthlyMessages - usage.messagesCountSinceLastReset,
      tier: user.tier,
    };
  },
});

function getTierLimits(tier: string) {
  switch (tier) {
    case "free":
      return { monthlyMessages: 100, tokenLimit: 50000 };
    case "premium-level-1":
      return { monthlyMessages: Infinity, tokenLimit: Infinity };
    default:
      return { monthlyMessages: 100, tokenLimit: 50000 };
  }
}
```

### 2. Graceful Degradation for Limits

**Enhanced AI SDK Integration**:

```typescript
// In your chat completion function
export const sendMessage = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const userId = getUserId(ctx); // Your auth helper
    
    // Check usage limits
    const usageCheck = await checkUsageLimit(ctx, { userId });
    
    if (!usageCheck.canSendMessage) {
      throw new ConvexError({
        code: "USAGE_LIMIT_EXCEEDED",
        message: "Monthly message limit exceeded. Please upgrade to continue.",
        tier: usageCheck.tier,
      });
    }
    
    // Proceed with AI completion...
    // Update usage after successful completion
  },
});
```

## Real-Time Subscription Updates

### 1. Convex Real-Time Benefits

**Subscription Status Updates**:
- When webhook updates subscription in Convex
- All connected clients instantly receive the update
- UI automatically reflects new subscription status
- No manual polling or refresh required

**Implementation**:

```typescript
// Client component automatically updates when subscription changes
export function SubscriptionBanner() {
  const { subscription, tier } = useSubscription();
  
  // This will update in real-time when webhooks modify the subscription
  if (tier === "free") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p>You're on the free plan. Upgrade for unlimited access!</p>
      </div>
    );
  }
  
  if (subscription?.cancelAtPeriodEnd) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p>Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
      </div>
    );
  }
  
  return null;
}
```

## Security Considerations for T3 Stack

### 1. Clerk + Convex + Stripe Security

**Multi-Layer Security**:
- **Clerk Authentication**: Handles user authentication and session management
- **Convex RLS**: Ensures users can only access their own data
- **Stripe Webhook Verification**: Validates all webhook requests
- **Environment Variables**: Secure storage of API keys

**Implementation Pattern**:

```typescript
// Convex mutation with built-in RLS
export const updateSubscription = mutation({
  args: { subscriptionData: v.object({}) },
  handler: async (ctx, args) => {
    // Convex RLS automatically ensures user can only update their own subscription
    const userId = getUserId(ctx); // Your RLS helper
    
    // This query will automatically filter to only this user's data
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .unique();
      
    // Update logic...
  },
});
```

## Testing Strategy for T3 Stack

### 1. Development Environment Setup

**Local Testing with Convex**:
```bash
# Start Convex dev environment
npx convex dev

# Start Next.js with Stripe CLI webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhooks
npm run dev
```

**Test Data Seeding**:
```typescript
// convex/testData.ts - Only run in development
export const seedTestSubscriptions = mutation({
  handler: async (ctx) => {
    if (process.env.NODE_ENV !== "development") return;
    
    // Create test subscriptions for development
    // This helps test UI components without real Stripe data
  },
});
```

### 2. Integration Testing

**Key Test Scenarios**:
1. **User Registration Flow**: Clerk signup → Stripe customer creation → Convex storage
2. **Subscription Creation**: Checkout → Webhook → Convex update → Real-time UI update
3. **Tier Changes**: Plan upgrade → Usage limit updates → AI access changes
4. **Cancellation Flow**: Subscription cancel → Grace period → Feature restriction

## Deployment Considerations

### 1. Environment Configuration

**Production Environment Variables**:
```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Convex
CONVEX_DEPLOYMENT=prod:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk  
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### 2. Deployment Checklist

**Pre-Production Steps**:
- [ ] Switch to Stripe live mode
- [ ] Configure production webhook endpoints
- [ ] Test webhook delivery in production
- [ ] Set up monitoring for subscription events
- [ ] Configure proper error handling and alerting
- [ ] Test subscription flows end-to-end

## Conclusion

The T3 stack provides an excellent foundation for Stripe subscriptions:

**Key Advantages**:
- **Convex** handles complex data consistency automatically
- **Clerk** provides seamless authentication integration
- **Next.js App Router** offers modern API patterns
- **Real-time updates** provide instant subscription status changes
- **TypeScript** ensures type safety across the entire stack

**Critical Success Factors**:
1. Follow Theo's "single source of truth" pattern with Stripe
2. Leverage Convex's ACID transactions for data consistency
3. Use Clerk's authentication seamlessly with Stripe customer mapping
4. Implement comprehensive webhook handling
5. Build real-time UI updates with Convex subscriptions

The next document will provide a detailed implementation plan with step-by-step instructions.