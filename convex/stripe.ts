import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import Stripe from 'stripe';

// Initialize Stripe - environment variables handled by Convex runtime
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// 🔄 TEMPORARY - Price ID to tier mapping - update with your actual Stripe price IDs
const PRICE_TO_TIER_MAP: Record<string, "free" | "premium-level-1"> = {
  'price_1234567890': 'premium-level-1', // Replace with actual price ID
  'price_0987654321': 'premium-level-1', // Replace with actual price ID
};

function mapPriceIdToTier(priceId: string): "free" | "premium-level-1" {
  return PRICE_TO_TIER_MAP[priceId] || "free";
}

// ✅ PERMANENT - Customer management functions
export const getOrCreateStripeCustomer = mutation({
  args: { 
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check if customer mapping already exists
    const existingCustomer = await ctx.db
      .query("stripeCustomers")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique();
      
    if (existingCustomer) {
      return {
        stripeCustomerId: existingCustomer.stripeCustomerId,
        isNew: false
      };
    }
    
    // Create new Stripe customer (Stripe is authoritative)
    const stripeCustomer = await stripe.customers.create({
      email: args.email,
      name: args.name,
      metadata: { 
        userId: args.userId,
        source: 't3-chat-app'
      },
    });
    
    // Store minimal mapping in Convex
    await ctx.db.insert("stripeCustomers", {
      userId: args.userId,
      stripeCustomerId: stripeCustomer.id,
      email: args.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return {
      stripeCustomerId: stripeCustomer.id,
      isNew: true
    };
  },
});

// ✅ PERMANENT - Checkout session creation
export const createCheckoutSession = mutation({
  args: { 
    priceId: v.string(),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Get or create Stripe customer
    const result = await getOrCreateStripeCustomer(ctx, {
      userId: args.userId,
      email: args.email,
      name: args.name,
    });
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: result.stripeCustomerId,
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

// ✅ PERMANENT - ACID-compliant sync function following single source of truth
export const syncStripeSubscription = mutation({
  args: { 
    stripeCustomerId: v.string(),
    stripeEventId: v.optional(v.string()) // For webhook idempotency
  },
  handler: async (ctx, args) => {
    // Idempotency check for webhook events
    if (args.stripeEventId) {
      const existingEvent = await ctx.db
        .query("stripeWebhookEvents")
        .withIndex("byStripeEventId", (q) => q.eq("stripeEventId", args.stripeEventId))
        .unique();
        
      if (existingEvent?.processed) {
        return { status: "already_processed" };
      }
    }

    try {
      // Fetch current state from Stripe (single source of truth)
      const subscriptions = await stripe.subscriptions.list({
        customer: args.stripeCustomerId,
        limit: 1,
        status: "all",
      });
      
      // Get user mapping
      const customer = await ctx.db
        .query("stripeCustomers")
        .withIndex("byStripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
        .unique();
        
      if (!customer) {
        throw new ConvexError(`Customer mapping not found: ${args.stripeCustomerId}`);
      }
      
      const now = Date.now();
      
      if (subscriptions.data.length === 0) {
        // No active subscription - clean up local cache
        const existingSub = await ctx.db
          .query("subscriptions")
          .withIndex("byUserId", (q) => q.eq("userId", customer.userId))
          .unique();
          
        if (existingSub) {
          await ctx.db.delete(existingSub._id);
        }
        
        // Update user tier to free
        await updateUserTier(ctx, customer.userId, "free");
        
        // Mark event as processed
        if (args.stripeEventId) {
          await logWebhookEvent(ctx, args.stripeEventId, "customer.subscription.deleted", true);
        }
        
        return { tier: "free", status: "no_subscription" };
      }
      
      // Process the most recent subscription
      const subscription = subscriptions.data[0];
      const tier = mapPriceIdToTier(subscription.items.data[0].price.id);
      
      // Prepare minimal subscription cache
      const subData = {
        userId: customer.userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: args.stripeCustomerId,
        status: subscription.status as any,
        priceId: subscription.items.data[0].price.id,
        tier,
        currentPeriodEnd: subscription.current_period_end * 1000, // Convert to milliseconds
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: now,
      };
      
      // Upsert subscription cache
      const existingSub = await ctx.db
        .query("subscriptions")
        .withIndex("byUserId", (q) => q.eq("userId", customer.userId))
        .unique();
        
      if (existingSub) {
        await ctx.db.patch(existingSub._id, subData);
      } else {
        await ctx.db.insert("subscriptions", subData);
      }
      
      // Update user tier
      await updateUserTier(ctx, customer.userId, tier);
      
      // Mark event as processed
      if (args.stripeEventId) {
        await logWebhookEvent(ctx, args.stripeEventId, "customer.subscription.updated", true);
      }
      
      return { tier, status: subscription.status };
    } catch (error: any) {
      console.error('Error syncing subscription:', error);
      
      // Log failed event
      if (args.stripeEventId) {
        await logWebhookEvent(ctx, args.stripeEventId, "sync_error", false, error.message);
      }
      
      throw new ConvexError(`Failed to sync subscription: ${error.message}`);
    }
  },
});

// ✅ PERMANENT - Helper function to update user tier
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

// ✅ PERMANENT - Helper function for webhook event logging
async function logWebhookEvent(
  ctx: any,
  stripeEventId: string,
  eventType: string,
  processed: boolean,
  error?: string
) {
  const existingEvent = await ctx.db
    .query("stripeWebhookEvents")
    .withIndex("byStripeEventId", (q) => q.eq("stripeEventId", stripeEventId))
    .unique();
    
  const eventData = {
    stripeEventId,
    eventType,
    processed,
    processedAt: processed ? Date.now() : undefined,
    error,
    createdAt: Date.now(),
  };
  
  if (existingEvent) {
    await ctx.db.patch(existingEvent._id, eventData);
  } else {
    await ctx.db.insert("stripeWebhookEvents", eventData);
  }
}

// ✅ PERMANENT - Query functions for frontend
export const getUserSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .unique();
      
    if (!user) return null;
    
    return await ctx.db
      .query("subscriptions")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const getStripeCustomer = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .unique();
      
    if (!user) return null;
    
    return await ctx.db
      .query("stripeCustomers")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .unique();
  },
});

// 🔄 TEMPORARY - Demo/development helper functions
export const getAllSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    // Only for development/demo purposes
    return await ctx.db.query("subscriptions").collect();
  },
});

export const getAllStripeCustomers = query({
  args: {},
  handler: async (ctx) => {
    // Only for development/demo purposes  
    return await ctx.db.query("stripeCustomers").collect();
  },
});

export const getWebhookEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Only for development/demo purposes
    return await ctx.db
      .query("stripeWebhookEvents")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// 🔄 TEMPORARY - Reset functions for development
export const resetUserSubscription = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .unique();
      
    if (!user) return;
    
    // Delete subscription cache
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .unique();
      
    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
    
    // Reset user tier
    await ctx.db.patch(user._id, { tier: "free" });
    
    return { success: true };
  },
});