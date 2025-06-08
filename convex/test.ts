import { query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const testAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new ConvexError("Not authenticated");
    }
    // User is authenticated, you can return something or proceed
    return { authenticated: true, user: identity };
  },
});
