import { ConvexError, v } from "convex/values";
// import { aiModelProviders } from "./schema";
import { queryWithRLS, mutationWithRLS } from "./rls";
import { INTERNAL_getCurrentUserOrThrow } from "./lib";
import { paginationOptsValidator } from "convex/server";
import { Doc } from "./_generated/dataModel";
import { threadLiveStates } from "./schema";

export const saveChat = mutationWithRLS({
  args: {
    uuid: v.string(),
    messages: v.string(),
    liveState: v.optional(threadLiveStates),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("threads")
      .withIndex("byUuid", (q) => q.eq("uuid", args.uuid))
      .unique();
    if (!thread) {
      throw new ConvexError("Thread not found");
    }

    await ctx.db.patch(thread._id, {
      messages: args.messages,
      liveState: args.liveState,
    });
  },
});

export const createChat = mutationWithRLS({
  args: {
    uuid: v.string(),
    messages: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await INTERNAL_getCurrentUserOrThrow(ctx);

    // ensure the thread does not exist
    const existingThread = await ctx.db
      .query("threads")
      .withIndex("byUuid", (q) => q.eq("uuid", args.uuid))
      .unique();
    if (existingThread) {
      throw new ConvexError("Thread already exists");
    }

    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      uuid: args.uuid,
      messages: args.messages,
      createdAt: now,
      updatedAt: now,
      userId: user._id,
      status: "active",
      liveState: "pending",
    });

    const thread = await ctx.db.get(threadId);
    if (!thread) {
      return null;
    }

    return thread;
  },
});

export const updateChatLiveState = mutationWithRLS({
  args: {
    id: v.id("threads"),
    liveState: threadLiveStates,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      liveState: args.liveState,
    });
  },
});

export const setChatTitle = mutationWithRLS({
  args: {
    uuid: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("threads")
      .withIndex("byUuid", (q) => q.eq("uuid", args.uuid))
      .unique();
    if (!thread) {
      return null;
    }

    await ctx.db.patch(thread._id, {
      title: args.title,
    });
  },
});

export const setChatLastUsedModel = mutationWithRLS({
  args: {
    id: v.id("threads"),
    lastUsedModelId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastUsedModelId: args.lastUsedModelId,
    });
  },
});

export const patchChat = mutationWithRLS({
  args: {
    id: v.id("threads"),
    lastUsedModelId: v.optional(v.string()),
    liveState: v.optional(threadLiveStates),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastUsedModelId: args.lastUsedModelId,
      liveState: args.liveState,
    });
  },
});

export const deleteChat = mutationWithRLS({
  args: {
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("threads")
      .withIndex("byUuid", (q) => q.eq("uuid", args.uuid))
      .unique();
    if (!thread) {
      return null;
    }

    await ctx.db.patch(thread._id, {
      status: "deleted",
    });
  },
});

export const deleteThreadById = mutationWithRLS({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    // The RLS wrapper will ensure the user can only delete their own threads.
    await ctx.db.patch(args.threadId, {
      status: "deleted",
    });
  },
});

export const getChat = queryWithRLS({
  args: {
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    const rawThread = await ctx.db
      .query("threads")
      .withIndex("byUuid", (q) => q.eq("uuid", args.uuid))
      .unique();
    if (!rawThread) {
      return null;
    }

    return rawThread;
  },
});

type ThreadForListing = Omit<Doc<"threads">, "messages" | "metadata">;

export const getUserThreadsForListing = queryWithRLS({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const paginatedThreads = await ctx.db
      .query("threads")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...paginatedThreads,
      page: paginatedThreads.page.map(
        (thread): ThreadForListing => ({
          _id: thread._id,
          _creationTime: thread._creationTime,
          uuid: thread.uuid,
          title: thread.title,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          status: thread.status,
          userId: thread.userId,
          liveState: thread.liveState,
        })
      ),
    };
  },
});
