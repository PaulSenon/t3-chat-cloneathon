import { ConvexError, v } from "convex/values";
// import { aiModelProviders } from "./schema";
import { queryWithRLS, mutationWithRLS } from "./rls";
import { INTERNAL_getCurrentUserOrThrow } from "./lib";
import { paginationOptsValidator } from "convex/server";
import { Doc } from "./_generated/dataModel";
import type { Message } from "ai";

export const saveChat = mutationWithRLS({
  args: {
    uuid: v.string(),
    messages: v.string(),
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

    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      uuid: args.uuid,
      messages: args.messages,
      createdAt: now,
      updatedAt: now,
      userId: user._id,
      status: "active",
    });

    const thread = await ctx.db.get(threadId);
    if (!thread) {
      return null;
    }

    return thread;
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

    await ctx.db.delete(thread._id);
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
        })
      ),
    };
  },
});
