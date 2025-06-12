import { ConvexError, v } from "convex/values";
// import { aiModelProviders } from "./schema";
import { queryWithRLS, mutationWithRLS } from "./rls";
import { INTERNAL_getCurrentUserOrThrow } from "./lib";
import { paginationOptsValidator } from "convex/server";

export const saveChat = mutationWithRLS({
  args: {
    uuid: v.string(),
    messages: v.any(),
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
    messages: v.any(),
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

export const getChat = queryWithRLS({
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

    return thread;
  },
});

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
