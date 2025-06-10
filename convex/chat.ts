import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { aiModelProviders } from "./schema";

// Send a user message and create response shell
export const sendMessage = mutation({
  args: {
    threadId: v.optional(v.id("threads")),
    content: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(aiModelProviders),
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

    let threadId = args.threadId;

    // Create new thread if none provided
    if (!threadId) {
      const now = Date.now();
      threadId = await ctx.db.insert("threads", {
        userId: user._id,
        title: undefined, // Will be auto-generated from first message
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Verify user owns the thread
      const thread = await ctx.db.get(threadId);
      if (!thread) {
        throw new ConvexError("Thread not found");
      }

      if (thread.userId !== user._id) {
        throw new ConvexError("Not authorized to send message to this thread");
      }

      if (thread.status === "deleted") {
        throw new ConvexError("Cannot send message to deleted thread");
      }
    }

    // Get next sequence number for user message
    const lastMessage = await ctx.db
      .query("messages")
      .withIndex("byThreadIdSequenceNumber", (q) => q.eq("threadId", threadId))
      .order("desc")
      .first();

    const userSequenceNumber = (lastMessage?.sequenceNumber ?? -1) + 1;
    const now = Date.now();

    // Create user message
    const userMessageId = await ctx.db.insert("messages", {
      threadId,
      userId: user._id,
      role: "user",
      parts: [
        {
          type: "text",
          content: args.content,
        },
      ],
      sequenceNumber: userSequenceNumber,
      usage: {
        tokenCount: 0,
        toolCallCount: 0,
      },
      status: "completed",
      createdAt: now,
      updatedAt: now,
    });

    // Create assistant message shell for streaming
    const assistantMessageId = await ctx.db.insert("messages", {
      threadId,
      userId: user._id,
      role: "assistant",
      parts: [], // Will be populated during streaming
      sequenceNumber: userSequenceNumber + 1,
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

    // Update thread's updatedAt and auto-generate title if needed
    const thread = await ctx.db.get(threadId);
    const threadUpdate = {
      updatedAt: now,
      ...(!thread?.title &&
        args.content && {
          title:
            args.content.slice(0, 50) + (args.content.length > 50 ? "..." : ""),
        }),
    };

    await ctx.db.patch(threadId, threadUpdate);

    const userMessage = await ctx.db.get(userMessageId);
    const assistantMessage = await ctx.db.get(assistantMessageId);

    return {
      threadId,
      userMessage,
      assistantMessage,
    };
  },
});

// Get conversation history for AI context
export const getConversationHistory = query({
  args: {
    threadId: v.id("threads"),
    limit: v.optional(v.number()),
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

    // Get messages in chronological order (oldest first)
    const query = ctx.db
      .query("messages")
      .withIndex("byThreadIdSequenceNumber", (q) =>
        q.eq("threadId", args.threadId)
      )
      .order("asc");

    const messages = args.limit
      ? await query.take(args.limit)
      : await query.collect();

    // Convert to AI SDK format
    return messages
      .filter((msg) => msg.status === "completed")
      .map((msg) => ({
        id: msg._id,
        role: msg.role,
        content: msg.parts
          .filter((part) => part.type === "text")
          .map((part) => part.content)
          .join(""),
        // Include tool calls and other parts if needed
        toolInvocations: msg.parts
          .filter(
            (part) => part.type === "tool-call" || part.type === "tool-result"
          )
          .map((part) => ({
            toolCallId: part.metadata?.toolCallId || "",
            toolName: part.metadata?.toolName || "",
            args: part.type === "tool-call" ? part.content : undefined,
            result: part.type === "tool-result" ? part.content : undefined,
          })),
        createdAt: new Date(msg.createdAt).toISOString(),
      }));
  },
});

// Stream completion for AI response
export const streamCompletion = mutation({
  args: {
    messageId: v.id("messages"),
    textDelta: v.optional(v.string()),
    toolCall: v.optional(
      v.object({
        id: v.string(),
        name: v.string(),
        args: v.any(),
      })
    ),
    toolResult: v.optional(
      v.object({
        id: v.string(),
        result: v.any(),
      })
    ),
    status: v.optional(v.literal("streaming")),
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
    const currentParts = [...message.parts];

    // Handle text delta
    if (args.textDelta) {
      // Find or create text part
      const textPartIndex = currentParts.findIndex(
        (part) => part.type === "text"
      );
      if (textPartIndex >= 0) {
        currentParts[textPartIndex] = {
          ...currentParts[textPartIndex],
          content: (currentParts[textPartIndex].content || "") + args.textDelta,
        };
      } else {
        currentParts.push({
          type: "text",
          content: args.textDelta,
        });
      }
    }

    // Handle tool call
    if (args.toolCall) {
      currentParts.push({
        type: "tool-call",
        content: args.toolCall.args,
        metadata: {
          toolCallId: args.toolCall.id,
          toolName: args.toolCall.name,
        },
      });
    }

    // Handle tool result
    if (args.toolResult) {
      currentParts.push({
        type: "tool-result",
        content: args.toolResult.result,
        metadata: {
          toolCallId: args.toolResult.id,
        },
      });
    }

    const updateData = {
      parts: currentParts,
      updatedAt: now,
      ...(args.status && { status: args.status }),
    };

    await ctx.db.patch(args.messageId, updateData);

    // Update thread's updatedAt
    await ctx.db.patch(message.threadId, {
      updatedAt: now,
    });

    return await ctx.db.get(args.messageId);
  },
});

// Complete streaming response
export const completeStreaming = mutation({
  args: {
    messageId: v.id("messages"),
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
      throw new ConvexError("Not authorized to complete this message");
    }

    const now = Date.now();

    const updateData = {
      status: "completed" as const,
      updatedAt: now,
      ...(args.usage && { usage: args.usage }),
      ...(args.metadata && { metadata: args.metadata }),
    };

    await ctx.db.patch(args.messageId, updateData);

    // Update thread metadata and usage stats (similar to finalizeMessage)
    const threadUpdate = {
      updatedAt: now,
      ...(message.provider &&
        message.model && {
          metadata: {
            lastUsedModel: message.model,
            lastUsedProvider: message.provider,
          },
        }),
    };

    await ctx.db.patch(message.threadId, threadUpdate);

    // Update user usage stats
    if (args.usage) {
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
