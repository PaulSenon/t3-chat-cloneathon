import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Get user's threads with pagination (ordered by update date)
export const getUserThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    return await ctx.db
      .query("threads")
      .withIndex("byUserId&UpdatedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .paginate(args.paginationOpts);
  },
});

// Create a new thread
export const createThread = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const now = Date.now();

    const threadId = await ctx.db.insert("threads", {
      userId: user._id,
      title: args.title,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(threadId);
  },
});

// Rename a thread
export const renameThread = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new ConvexError("Thread not found");
    }

    if (thread.userId !== user._id) {
      throw new ConvexError("Not authorized to rename this thread");
    }

    if (thread.status === "deleted") {
      throw new ConvexError("Cannot rename deleted thread");
    }

    await ctx.db.patch(args.threadId, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.threadId);
  },
});

// Delete a thread (soft delete)
export const deleteThread = mutation({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new ConvexError("Thread not found");
    }

    if (thread.userId !== user._id) {
      throw new ConvexError("Not authorized to delete this thread");
    }

    await ctx.db.patch(args.threadId, {
      status: "deleted",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get thread by ID (with auth check)
export const getThread = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new ConvexError("Thread not found");
    }

    if (thread.userId !== user._id) {
      throw new ConvexError("Not authorized to access this thread");
    }

    if (thread.status === "deleted") {
      throw new ConvexError("Thread has been deleted");
    }

    return thread;
  },
});

// Update thread metadata (last used model/provider)
export const updateThreadMetadata = mutation({
  args: {
    threadId: v.id("threads"),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new ConvexError("Thread not found");
    }

    if (thread.userId !== user._id) {
      throw new ConvexError("Not authorized to update this thread");
    }

    if (thread.status === "deleted") {
      throw new ConvexError("Cannot update deleted thread");
    }

    const metadata = thread.metadata || {
      lastUsedModel: "",
      lastUsedProvider: "openai",
    };
    if (args.model) metadata.lastUsedModel = args.model;
    if (args.provider)
      metadata.lastUsedProvider = args.provider as "openai" | "anthropic";

    await ctx.db.patch(args.threadId, {
      metadata,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.threadId);
  },
});
