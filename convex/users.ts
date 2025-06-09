import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { subscriptionTiers } from "./schema";

// Get or create user from Clerk auth
export const getOrCreateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      return existingUser;
    }

    // Create new user with free tier
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name,
      tier: "free",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(userId);
  },
});

// Get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
  },
});

// Update user tier (for Stripe integration)
export const updateUserTier = mutation({
  args: {
    tokenIdentifier: v.string(),
    tier: subscriptionTiers,
    // stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    // todo: check stripe api if subscription is active or throw error

    await ctx.db.patch(user._id, {
      tier: args.tier,
      // stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
  },
});
