import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";

// ==========================================
// Authentication Utilities
// ==========================================

/**
 * Get current user or return null if not authenticated
 */
export async function INTERNAL_getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("byTokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();
}

/**
 * Get current user or throw if not authenticated
 */
export async function INTERNAL_getCurrentUserOrThrow(
  ctx: QueryCtx | MutationCtx
) {
  const user = await INTERNAL_getCurrentUser(ctx);
  if (!user) {
    throw new ConvexError("Not authenticated");
  }
  return user;
}
