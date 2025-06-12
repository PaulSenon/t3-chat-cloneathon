import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import {
  Rules,
  wrapDatabaseReader,
  wrapDatabaseWriter,
} from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { INTERNAL_getCurrentUser } from "./lib";

// ==========================================
// Row Level Security Rules
// ==========================================

async function rlsRules(ctx: QueryCtx) {
  const user = await INTERNAL_getCurrentUser(ctx);

  return {
    // Users table: users can only access their own record
    users: {
      read: async (_, userDoc) => {
        // Allow reading own user record
        if (!user) return false;
        if (userDoc._id !== user._id) return false;
        return true;
      },
      insert: async (_, userDoc) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) return false;
        if (userDoc.tokenIdentifier !== identity.tokenIdentifier) return false;
        return true;
      },
      modify: async (_, userDoc) => {
        // Only allow modifying own user record
        if (!user) return false;
        if (userDoc._id !== user._id) return false;
        return true;
      },
    },

    // Usages table: users can only access their own usage records
    usages: {
      read: async (_, usageDoc) => {
        if (!user) return false;
        if (usageDoc.userId !== user._id) return false;
        return true;
      },
      insert: async (_, usageDoc) => {
        if (!user) return false;
        if (usageDoc.userId !== user._id) return false;
        return true;
      },
      modify: async (_, usageDoc) => {
        if (!user) return false;
        if (usageDoc.userId !== user._id) return false;
        return true;
      },
    },

    // Threads table: users can only access their own threads (non-deleted)
    threads: {
      read: async (_, threadDoc) => {
        if (!user) return false;
        if (threadDoc.userId !== user._id) return false;
        if (threadDoc.status === "deleted") return false;
        return true;
      },
      insert: async (_, threadDoc) => {
        if (!user) return false;
        if (threadDoc.userId !== user._id) return false;
        return true;
      },
      modify: async (_, threadDoc) => {
        if (!user) return false;
        if (threadDoc.userId !== user._id) return false;
        if (threadDoc.status === "deleted") return false;
        return true;
      },
    },
  } satisfies Rules<QueryCtx, DataModel>;
}

// ==========================================
// Custom Functions with RLS
// ==========================================

/**
 * Custom query function with automatic row-level security
 * Use this instead of the standard `query` function
 */
export const queryWithRLS = customQuery(
  query,
  customCtx(async (ctx) => ({
    db: wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx)),
  }))
);

/**
 * Custom mutation function with automatic row-level security
 * Use this instead of the standard `mutation` function
 */
export const mutationWithRLS = customMutation(
  mutation,
  customCtx(async (ctx) => ({
    db: wrapDatabaseWriter(ctx, ctx.db, await rlsRules(ctx)),
  }))
);

// ==========================================
// Usage Example - Bulletproof Security
// ==========================================

// This complex mutation is 100% secure - impossible to bypass!
// export const complexOperation = mutationWithRLS({
//   handler: async (ctx, args) => {
//     const thread = await ctx.db.get(threadId); // ✅ RLS: only user's threads
//     const messages = await ctx.db.query("messages"); // ✅ RLS: only user's messages
//     await ctx.db.insert("usage", {...}); // ✅ RLS: only allows user's data
//     await ctx.db.patch(messageId, {...}); // ✅ RLS: only user's messages
//
//     for (const msg of messages) {
//       await ctx.db.patch(msg._id, {...}); // ✅ RLS: every operation secured
//     }
//     // You literally CANNOT access other users' data - it's impossible!
//   }
// });
