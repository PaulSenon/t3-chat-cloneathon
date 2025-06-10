import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import {
  aiMessageRoles,
  messageLifecycleStatuses,
  messagePartTypes,
  aiModelProviders,
} from "./schema";

// Get messages for a thread with pagination (ordered by sequence number)
export const getThreadMessages = query({
  args: {
    threadId: v.id("threads"),
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

    // Verify user owns the thread
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

    return await ctx.db
      .query("messages")
      .withIndex("byThreadIdSequenceNumber", (q) =>
        q.eq("threadId", args.threadId)
      )
      .order("desc") // Latest messages first
      .paginate(args.paginationOpts);
  },
});

// Create a new message shell (empty initially for streaming)
export const createMessage = mutation({
  args: {
    threadId: v.id("threads"),
    role: aiMessageRoles,
    parentMessageId: v.optional(v.id("messages")),
    provider: v.optional(aiModelProviders),
    model: v.optional(v.string()),
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

    // Verify user owns the thread
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new ConvexError("Thread not found");
    }

    if (thread.userId !== user._id) {
      throw new ConvexError("Not authorized to add message to this thread");
    }

    if (thread.status === "deleted") {
      throw new ConvexError("Cannot add message to deleted thread");
    }

    // Get next sequence number
    const lastMessage = await ctx.db
      .query("messages")
      .withIndex("byThreadIdSequenceNumber", (q) =>
        q.eq("threadId", args.threadId)
      )
      .order("desc")
      .first();

    const sequenceNumber = (lastMessage?.sequenceNumber ?? -1) + 1;
    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      threadId: args.threadId,
      userId: user._id,
      role: args.role,
      parts: [], // Start empty for streaming
      sequenceNumber,
      parentMessageId: args.parentMessageId,
      provider: args.provider,
      model: args.model,
      usage: {
        tokenCount: 0,
        toolCallCount: 0,
      },
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Update thread's updatedAt
    await ctx.db.patch(args.threadId, {
      updatedAt: now,
    });

    return await ctx.db.get(messageId);
  },
});

// Update message content (for streaming chunks)
export const updateMessageContent = mutation({
  args: {
    messageId: v.id("messages"),
    parts: v.array(
      v.object({
        type: messagePartTypes,
        content: v.any(),
        metadata: v.optional(v.record(v.string(), v.any())),
      })
    ),
    status: v.optional(messageLifecycleStatuses),
    usage: v.optional(
      v.object({
        tokenCount: v.number(),
        toolCallCount: v.number(),
      })
    ),
    metadata: v.optional(v.record(v.string(), v.any())),
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

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Verify user owns the thread
    const thread = await ctx.db.get(message.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError("Not authorized to update this message");
    }

    const now = Date.now();
    const updateData = {
      parts: args.parts,
      updatedAt: now,
      ...(args.status && { status: args.status }),
      ...(args.usage && { usage: args.usage }),
      ...(args.metadata && { metadata: args.metadata }),
    };

    await ctx.db.patch(args.messageId, updateData);

    // Update thread's updatedAt
    await ctx.db.patch(message.threadId, {
      updatedAt: now,
    });

    return await ctx.db.get(args.messageId);
  },
});

// Finalize message (mark as completed or error)
export const finalizeMessage = mutation({
  args: {
    messageId: v.id("messages"),
    status: v.union(
      v.literal("completed"),
      v.literal("error"),
      v.literal("cancelled")
    ),
    usage: v.optional(
      v.object({
        tokenCount: v.number(),
        toolCallCount: v.number(),
      })
    ),
    metadata: v.optional(v.record(v.string(), v.any())),
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

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Verify user owns the thread
    const thread = await ctx.db.get(message.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError("Not authorized to finalize this message");
    }

    const now = Date.now();
    const updateData = {
      status: args.status,
      updatedAt: now,
      ...(args.usage && { usage: args.usage }),
      ...(args.metadata && { metadata: args.metadata }),
    };

    await ctx.db.patch(args.messageId, updateData);

    // Update thread's updatedAt and metadata if this is an AI response
    const threadUpdate = {
      updatedAt: now,
      ...(message.role === "assistant" &&
        message.provider &&
        message.model && {
          metadata: {
            lastUsedModel: message.model,
            lastUsedProvider: message.provider,
          },
        }),
    };

    await ctx.db.patch(message.threadId, threadUpdate);

    // Update user usage stats if this is an AI response
    if (message.role === "assistant" && args.usage) {
      const usage = await ctx.db
        .query("usages")
        .withIndex("byUserId", (q) => q.eq("userId", user._id))
        .unique();

      if (usage) {
        await ctx.db.patch(usage._id, {
          tokenCountTotal: usage.tokenCountTotal + args.usage.tokenCount,
          tokenCountSinceLastReset:
            usage.tokenCountSinceLastReset + args.usage.tokenCount,
          messagesCountTotal: usage.messagesCountTotal + 1,
          messagesCountSinceLastReset: usage.messagesCountSinceLastReset + 1,
          updatedAt: now,
        });
      } else {
        // Create usage record if it doesn't exist
        await ctx.db.insert("usages", {
          userId: user._id,
          tokenCountTotal: args.usage.tokenCount,
          tokenCountSinceLastReset: args.usage.tokenCount,
          messagesCountTotal: 1,
          messagesCountSinceLastReset: 1,
          lastResetDate: now,
          updatedAt: now,
        });
      }
    }

    return await ctx.db.get(args.messageId);
  },
});

// Delete message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
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

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Verify user owns the thread
    const thread = await ctx.db.get(message.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError("Not authorized to delete this message");
    }

    await ctx.db.delete(args.messageId);

    // Update thread's updatedAt
    await ctx.db.patch(message.threadId, {
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Edit message content
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    parts: v.array(
      v.object({
        type: messagePartTypes,
        content: v.any(),
        metadata: v.optional(v.record(v.string(), v.any())),
      })
    ),
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

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Verify user owns the thread
    const thread = await ctx.db.get(message.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError("Not authorized to edit this message");
    }

    const now = Date.now();

    await ctx.db.patch(args.messageId, {
      parts: args.parts,
      updatedAt: now,
    });

    // Update thread's updatedAt
    await ctx.db.patch(message.threadId, {
      updatedAt: now,
    });

    return await ctx.db.get(args.messageId);
  },
});

// Get message by ID
export const getMessage = query({
  args: {
    messageId: v.id("messages"),
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

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Verify user owns the thread
    const thread = await ctx.db.get(message.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError("Not authorized to access this message");
    }

    return message;
  },
});
