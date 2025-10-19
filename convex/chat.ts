import { ConvexError, v } from "convex/values";
import { INTERNAL_getCurrentUserOrThrow } from "./lib";
import { mutationWithRLS, queryWithRLS } from "./rls";
import { paginationOptsValidator } from "convex/server";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { MyUIMessage, validateMyUIMessages } from "../src/types/messages";
import { Doc, Id } from "./_generated/dataModel";
import { lifecycleStates, liveStatuses } from "./schema";

// DONE
async function INTERNAL_upsertThread(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    threadUuid: string;
    patch?: {
      title?: Doc<"threads">["title"];
      lifecycleState?: Doc<"threads">["lifecycleState"];
      liveStatus?: Doc<"threads">["liveStatus"];
      lastUsedModelId?: Doc<"threads">["lastUsedModelId"];
    };
  }
) {
  const { threadUuid, userId, patch } = args;

  const existingThread = await ctx.db
    .query("threads")
    .withIndex("byUserIdUuid", (q) =>
      q.eq("userId", userId).eq("uuid", threadUuid)
    )
    .unique();

  const now = Date.now();
  if (!existingThread) {
    const threadId = await ctx.db.insert("threads", {
      uuid: threadUuid,
      createdAt: now,
      updatedAt: now,
      userId: userId,
      lifecycleState: patch?.lifecycleState ?? "active",
      liveStatus: patch?.liveStatus ?? "pending",
      lastUsedModelId: patch?.lastUsedModelId,
      title: patch?.title,
    });
    return threadId;
  }

  await ctx.db.patch(existingThread._id, {
    lifecycleState: patch?.lifecycleState,
    liveStatus: patch?.liveStatus,
    lastUsedModelId: patch?.lastUsedModelId,
    title: patch?.title,
    updatedAt: now,
  });

  return existingThread._id;

  //  const thread = await ctx.db.get(threadId);
  //  if (!thread) {
  //    throw new ConvexError("Failed creating new thread");
  //  }

  //  return thread;
}

async function encodeMessageParts(
  parts: unknown[]
): Promise<Doc<"messageParts">["encodedParts"]> {
  // TODO handle more encoding cases

  // json
  return {
    source: "inline",
    encoding: "json",
    data: JSON.stringify(parts),
  };
}
async function decodeMessageParts(
  encodedParts: Doc<"messageParts">["encodedParts"]
): Promise<unknown[]> {
  if (encodedParts.source === "cvxstorage")
    throw new ConvexError("Convex storage not yet implemented");

  if (encodedParts.encoding === "msgpack")
    throw new ConvexError("msgpack not yet supported");

  if (encodedParts.encoding === "json") {
    const decoded = JSON.parse(encodedParts.data) as unknown;
    if (!Array.isArray(decoded))
      throw new ConvexError("decoded parts format invalid (not an array)");
    return decoded;
  }

  throw new ConvexError("decoder not implemented for message parts");
}

// DONE
async function INTERNAL_upsertMessageParts(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    messageId: Id<"messages">;
    parts: unknown[];
  }
) {
  const { messageId, parts, userId } = args;

  const messageParts = await ctx.db
    .query("messageParts")
    .withIndex("byUserIdMessageId", (q) =>
      q.eq("userId", userId).eq("messageId", messageId)
    )
    .unique();

  const encodedPartPromises = encodeMessageParts(parts);
  if (!messageParts) {
    const messagePartsId = await ctx.db.insert("messageParts", {
      userId,
      messageId,
      encodedParts: await encodedPartPromises,
    });
    return messagePartsId;
  }
  await ctx.db.patch(messageParts._id, {
    encodedParts: await encodedPartPromises,
  });
  return messageParts._id;
}

async function INTERNAL_upsertMessageWithParts(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    threadId: Id<"threads">;
    uiMessage: MyUIMessage;
    patch?: {
      role?: Doc<"messages">["role"];
      lifecycleState?: Doc<"messages">["lifecycleState"];
      liveStatus?: Doc<"messages">["liveStatus"];
      modelId?: Doc<"messages">["modelId"];
    };
    now?: number;
  }
) {
  const { uiMessage, threadId, patch, userId } = args;

  const message = await ctx.db
    .query("messages")
    .withIndex("byUserIdThreadIdUuid", (q) =>
      q.eq("userId", userId).eq("threadId", threadId).eq("uuid", uiMessage.id)
    )
    .unique();

  const now = args.now ?? Date.now();
  if (!message) {
    const messageId = await ctx.db.insert("messages", {
      userId,
      threadId: threadId,
      uuid: uiMessage.id,
      updatedAt: now,
      createdAt: uiMessage.metadata?.createdAt ?? now,
      role: patch?.role ?? uiMessage.role,
      modelId: patch?.modelId ?? uiMessage.metadata?.modelId,
      lifecycleState: patch?.lifecycleState ?? "active",
      liveStatus:
        patch?.liveStatus ?? uiMessage.role === "assistant"
          ? "pending"
          : "completed",
    });
    await INTERNAL_upsertMessageParts(ctx, {
      userId,
      messageId,
      parts: uiMessage.parts,
    });
    return messageId;
  }
  await ctx.db.patch(message._id, {
    lifecycleState: patch?.lifecycleState,
    liveStatus: patch?.liveStatus,
    modelId: patch?.modelId ?? uiMessage.metadata?.modelId,
    role: patch?.role ?? uiMessage.role,
    updatedAt: now,
  });
  await INTERNAL_upsertMessageParts(ctx, {
    userId,
    messageId: message._id,
    parts: uiMessage.parts,
  });
  return message._id;
}

async function INTERNAL_getMessageParts(
  ctx: MutationCtx | QueryCtx,
  args: {
    userId: Id<"users">;
    messageId: Id<"messages">;
  }
) {
  const parts = await ctx.db
    .query("messageParts")
    .withIndex("byUserIdMessageId", (q) =>
      q.eq("userId", args.userId).eq("messageId", args.messageId)
    )
    .unique();

  if (!parts) throw new ConvexError("message part not found");

  const decodedParts = await decodeMessageParts(parts.encodedParts);

  return decodedParts;
}

// DONE
// 1. get messages from threadId and userId by createdAt asc
// 2. for each message get its parts and reconstruct UIMessage object
// 3. validate type MyUiMessage[]
async function INTERNAL_getAllThreadMessagesAsc(
  ctx: QueryCtx | MutationCtx,
  args: {
    userId: Id<"users">;
    threadId: Id<"threads">;
  }
) {
  const messages = await ctx.db
    .query("messages")
    .withIndex("byUserIdThreadIdCreatedAt", (q) =>
      q.eq("userId", args.userId).eq("threadId", args.threadId)
    )
    .order("asc")
    .collect();

  const messagesWithParts = await Promise.all(
    messages.map(async (message) => {
      const parts = await INTERNAL_getMessageParts(ctx, {
        userId: args.userId,
        messageId: message._id,
      });
      return {
        id: message.uuid,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parts: parts as any, // will be checked bellow
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: message.role as any, // will be checked bellow
        metadata: {
          modelId: message.modelId,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          lifecycleState: message.lifecycleState,
          liveStatus: message.liveStatus,
        },
      } satisfies MyUIMessage;
    })
  );

  // this is where we check
  const validatedMessages = await validateMyUIMessages(messagesWithParts);

  return validatedMessages;
}

// DONE
// for front: get all messages in thread
export const getAllThreadMessagesAsc = queryWithRLS({
  args: {
    threadUuid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await INTERNAL_getCurrentUserOrThrow(ctx);
    const thread = await ctx.db
      .query("threads")
      .withIndex("byUserIdUuid", (q) =>
        q.eq("userId", user._id).eq("uuid", args.threadUuid)
      )
      .unique();
    if (!thread) throw new ConvexError("thread not found");

    const threadId = thread._id;
    const messages = await INTERNAL_getAllThreadMessagesAsc(ctx, {
      threadId,
      userId: user._id,
    });
    return messages;
  },
});

// DONE
// for frontend: sidebar listing all threads (by updatedAt most recent first)
// paginated
export const getThreadsForListing = queryWithRLS({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await INTERNAL_getCurrentUserOrThrow(ctx);
    const paginatedThreads = await ctx.db
      .query("threads")
      .withIndex("byUserIdStateUpdatedAt", (q) =>
        q.eq("userId", user._id).eq("lifecycleState", "active")
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return paginatedThreads;
  },
});

// DONE
// for frontend: upsert message and its parts
export const upsertMessage = mutationWithRLS({
  args: {
    threadId: v.id("threads"),
    uiMessage: v.any(),
    role: v.optional(v.string()),
    lifecycleState: v.optional(lifecycleStates),
    liveStatus: v.optional(liveStatuses),
    modelId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const user = await INTERNAL_getCurrentUserOrThrow(ctx);
    const { threadId, uiMessage, lifecycleState, liveStatus, modelId, role } =
      args;
    const [validUiMessage] = await validateMyUIMessages([uiMessage]);
    const messageId = await INTERNAL_upsertMessageWithParts(ctx, {
      threadId,
      userId: user._id,
      uiMessage: validUiMessage,
      now: Date.now(),
      patch: {
        lifecycleState,
        liveStatus,
        modelId,
        role,
      },
    });

    return messageId;
  },
});

// DONE
// update message
export const updateMessage = mutationWithRLS({
  args: {
    messageId: v.id("messages"),
    uiMessage: v.any(),
    role: v.optional(v.string()),
    lifecycleState: v.optional(lifecycleStates),
    liveStatus: v.optional(liveStatuses),
    modelId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const user = await INTERNAL_getCurrentUserOrThrow(ctx);
    const { messageId, uiMessage, lifecycleState, liveStatus, modelId, role } =
      args;
    const [validUiMessage] = await validateMyUIMessages([uiMessage]);

    // TODO: ensure RLS cover this case because we don't check ownership here
    const patchMessagePromise = ctx.db.patch(messageId, {
      role: role ?? validUiMessage.role,
      lifecycleState:
        lifecycleState ?? validUiMessage?.metadata?.lifecycleState,
      liveStatus: liveStatus ?? validUiMessage?.metadata?.liveStatus,
      modelId: modelId ?? validUiMessage?.metadata?.modelId,
      updatedAt: Date.now(),
    });

    const patchMessagePartsPromise = await INTERNAL_upsertMessageParts(ctx, {
      messageId,
      userId: user._id,
      parts: validUiMessage.parts,
    });

    await Promise.all([patchMessagePromise, patchMessagePartsPromise]);

    return;
  },
});

// DONE
// delete message
export const deleteMessage = mutationWithRLS({
  args: {
    messageId: v.id("messages"),
  },
  async handler(ctx, args) {
    await INTERNAL_getCurrentUserOrThrow(ctx);
    const { messageId } = args;

    // TODO: ensure RLS cover this case because we don't check ownership here
    await ctx.db.patch(messageId, {
      lifecycleState: "deleted",
      updatedAt: Date.now(),
    });

    return;
  },
});

// DONE
// for frontend: upsert thread for optimistic update paginated thread listings
export const upsertThread = mutationWithRLS({
  args: {
    threadUuid: v.string(),
    title: v.optional(v.string()),
    lifecycleState: v.optional(lifecycleStates),
    liveStatus: v.optional(liveStatuses),
    lastUsedModelId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const user = await INTERNAL_getCurrentUserOrThrow(ctx);
    const { threadUuid, lastUsedModelId, lifecycleState, liveStatus, title } =
      args;
    const threadId = await INTERNAL_upsertThread(ctx, {
      threadUuid: threadUuid,
      userId: user._id,
      patch: {
        title,
        lastUsedModelId,
        lifecycleState,
        liveStatus,
      },
    });
    return threadId;
  },
});

// DONE
// update thread
export const updateThread = mutationWithRLS({
  args: {
    threadId: v.id("threads"),
    title: v.optional(v.string()),
    lifecycleState: v.optional(lifecycleStates),
    liveStatus: v.optional(liveStatuses),
    lastUsedModelId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    await INTERNAL_getCurrentUserOrThrow(ctx);
    const { threadId, lastUsedModelId, lifecycleState, liveStatus, title } =
      args;

    // TODO: ensure RLS cover this case because we don't check ownership here
    await ctx.db.patch(threadId, {
      lastUsedModelId,
      lifecycleState,
      liveStatus,
      title,
      updatedAt: Date.now(),
    });

    return;
  },
});

// DONE
// delete thread
export const deleteThread = mutationWithRLS({
  args: {
    threadId: v.id("threads"),
  },
  async handler(ctx, args) {
    await INTERNAL_getCurrentUserOrThrow(ctx);
    const { threadId } = args;

    // TODO: ensure RLS cover this case because we don't check ownership here
    await ctx.db.patch(threadId, {
      lifecycleState: "deleted",
      updatedAt: Date.now(),
    });

    return;
  },
});

// DONE
// for backend to do everything in one go
// 1. get or create thread
// 2. set new/fist messages
// 3. collect all messages for this thread.
export const upsertThreadWithNewMessagesAndReturnHistory = mutationWithRLS({
  args: {
    threadUuid: v.string(),
    uiMessages: v.array(v.any()),
    title: v.optional(v.string()),
    lifecycleState: v.optional(lifecycleStates),
    liveStatus: v.optional(liveStatuses),
    lastUsedModelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await INTERNAL_getCurrentUserOrThrow(ctx);
    const {
      threadUuid,
      uiMessages,
      lastUsedModelId,
      lifecycleState,
      liveStatus,
      title,
    } = args;
    const threadPromise = INTERNAL_upsertThread(ctx, {
      threadUuid,
      userId: user._id,
      patch: {
        lastUsedModelId,
        lifecycleState,
        liveStatus,
        title,
      },
    });
    const validatedMessagesPromise = validateMyUIMessages({
      messages: uiMessages,
    });

    const [threadId, validatedMessages] = await Promise.all([
      threadPromise,
      validatedMessagesPromise,
    ]);
    const insertPromises: Promise<unknown>[] = [];

    let now = Date.now();
    for (const uiMessage of validatedMessages) {
      insertPromises.push(
        INTERNAL_upsertMessageWithParts(ctx, {
          userId: user._id,
          threadId: threadId,
          uiMessage,
          now: now++,
        })
      );
    }
    await Promise.all(insertPromises);

    return INTERNAL_getAllThreadMessagesAsc(ctx, {
      userId: user._id,
      threadId: threadId,
    });
  },
});
