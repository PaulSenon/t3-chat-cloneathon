import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import {
  aiMessageRoles,
  messageLifecycleStatuses,
  messagePartTypes,
  aiModelProviders,
} from "./schema";

/**
 * Get messages for a thread with pagination (ordered by sequence number)
 * 
 * @description Retrieves messages for a specific thread with proper RLS security.
 * Messages are returned in descending order (latest first) with pagination support.
 * Only users who own the thread can access its messages.
 * 
 * @param threadId - The ID of the thread to get messages for
 * @param paginationOpts - Pagination options (cursor, numItems)
 * 
 * @returns Paginated list of messages with continuation cursor
 * 
 * @throws ConvexError "Not authenticated" - User not logged in
 * @throws ConvexError "User not found" - User record doesn't exist
 * @throws ConvexError "Thread not found" - Thread doesn't exist
 * @throws ConvexError "Not authorized to access this thread" - User doesn't own thread
 * @throws ConvexError "Thread has been deleted" - Thread is soft-deleted
 */
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

/**
 * Create a new message shell (empty initially for streaming)
 * 
 * @description Creates a new message record in "pending" status with empty parts.
 * This supports the streaming architecture where messages are created first,
 * then populated with content as the AI response streams in.
 * 
 * @param threadId - The thread to add the message to
 * @param role - The role of the message (user, assistant, system, tool)
 * @param parentMessageId - Optional parent message for threaded conversations
 * @param provider - Optional AI provider (openai, anthropic)
 * @param model - Optional specific model name
 * 
 * @returns The created message record
 * 
 * @throws ConvexError "Not authenticated" - User not logged in
 * @throws ConvexError "User not found" - User record doesn't exist
 * @throws ConvexError "Thread not found" - Thread doesn't exist
 * @throws ConvexError "Not authorized to add message to this thread" - User doesn't own thread
 * @throws ConvexError "Cannot add message to deleted thread" - Thread is deleted
 */
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

/**
 * Update message content (for streaming chunks)
 * 
 * @description Updates a message's content parts during streaming.
 * This is called repeatedly as AI response chunks arrive to build up
 * the complete message content. Supports partial updates and status changes.
 * 
 * @param messageId - The message to update
 * @param parts - Array of message parts (text, file, tool-call, etc.)
 * @param status - Optional status update (pending, streaming, completed, error)
 * @param usage - Optional token and tool usage statistics
 * @param metadata - Optional metadata for the message
 * 
 * @returns The updated message record
 * 
 * @throws ConvexError "Not authenticated" - User not logged in
 * @throws ConvexError "User not found" - User record doesn't exist
 * @throws ConvexError "Message not found" - Message doesn't exist
 * @throws ConvexError "Not authorized to update this message" - User doesn't own thread
 */
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

/**
 * Finalize message (mark as completed or error)
 * 
 * @description Marks a message as completed, error, or cancelled and updates
 * user usage statistics. This is the final step in the message lifecycle
 * and triggers usage tracking for billing purposes.
 * 
 * @param messageId - The message to finalize
 * @param status - Final status (completed, error, cancelled)
 * @param usage - Optional final token and tool usage statistics
 * @param metadata - Optional final metadata
 * 
 * @returns The finalized message record
 * 
 * @throws ConvexError "Not authenticated" - User not logged in
 * @throws ConvexError "User not found" - User record doesn't exist
 * @throws ConvexError "Message not found" - Message doesn't exist
 * @throws ConvexError "Not authorized to finalize this message" - User doesn't own thread
 */
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

/**
 * Delete message
 * 
 * @description Permanently deletes a message from the database.
 * This is a hard delete operation that cannot be undone.
 * Only the thread owner can delete messages.
 * 
 * @param messageId - The message to delete
 * 
 * @returns Success confirmation object
 * 
 * @throws ConvexError "Not authenticated" - User not logged in
 * @throws ConvexError "User not found" - User record doesn't exist
 * @throws ConvexError "Message not found" - Message doesn't exist
 * @throws ConvexError "Not authorized to delete this message" - User doesn't own thread
 */
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

/**
 * Edit message content
 * 
 * @description Updates the content parts of an existing message.
 * This allows users to edit their messages after sending.
 * Thread timestamps are updated to reflect the modification.
 * 
 * @param messageId - The message to edit
 * @param parts - New content parts to replace existing ones
 * 
 * @returns The updated message record
 * 
 * @throws ConvexError "Not authenticated" - User not logged in
 * @throws ConvexError "User not found" - User record doesn't exist
 * @throws ConvexError "Message not found" - Message doesn't exist
 * @throws ConvexError "Not authorized to edit this message" - User doesn't own thread
 */
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

/**
 * Get message by ID
 * 
 * @description Retrieves a single message by its ID with proper RLS security.
 * Only users who own the thread can access its messages.
 * 
 * @param messageId - The ID of the message to retrieve
 * 
 * @returns The message record
 * 
 * @throws ConvexError "Not authenticated" - User not logged in
 * @throws ConvexError "User not found" - User record doesn't exist
 * @throws ConvexError "Message not found" - Message doesn't exist
 * @throws ConvexError "Not authorized to access this message" - User doesn't own thread
 */
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
