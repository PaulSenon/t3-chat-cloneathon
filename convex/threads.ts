import { ConvexError, v } from "convex/values";
import { mutationWithRLS, queryWithRLS } from "./rls";
import { paginationOptsValidator } from "convex/server";
import { INTERNAL_getCurrentUserOrThrow } from "./lib";

export const getUserThreads = queryWithRLS({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("threads")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createThread = mutationWithRLS({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await INTERNAL_getCurrentUserOrThrow(ctx);

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

export const renameThread = mutationWithRLS({
  args: {
    threadId: v.id("threads"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new ConvexError("Thread not found");
    }

    await ctx.db.patch(args.threadId, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.threadId);
  },
});

export const deleteThread = mutationWithRLS({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, {
      status: "deleted",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getThread = queryWithRLS({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new ConvexError("Thread not found");
    }

    return thread;
  },
});

export const updateThreadMetadata = mutationWithRLS({
  args: {
    threadId: v.id("threads"),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new ConvexError("Thread not found");
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
