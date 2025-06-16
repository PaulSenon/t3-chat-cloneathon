import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const subscriptionTiers = v.union(
  v.literal("free"),
  v.literal("premium-level-1")
);

export const aiModelProviders = v.union(
  v.literal("openai"),
  v.literal("anthropic"),
  v.literal("google")
);
export const aiModels = v.string();

export const threadLifecycleStatuses = v.union(
  v.literal("active"),
  v.literal("archived"),
  v.literal("deleted")
);

export const threadLiveStates = v.union(
  v.literal("pending"),
  v.literal("streaming"),
  v.literal("completed"),
  v.literal("error"),
  v.literal("cancelled")
);

export const messageLifecycleStatuses = v.union(
  v.literal("pending"),
  v.literal("streaming"),
  v.literal("completed"),
  v.literal("error"),
  v.literal("cancelled")
);

export const aiMessageRoles = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system"),
  v.literal("tool")
);

// AI SDK v4 compatible message part types
export const messagePartTypes = v.union(
  v.literal("text"),
  v.literal("image"),
  v.literal("file"),
  v.literal("tool-call"),
  v.literal("tool-result"),
  v.literal("reasoning"), // for reasoning models
  v.literal("source"), // for source citations
  v.literal("data") // for custom data parts
);

// AI SDK v4 tool invocation states
export const toolInvocationStates = v.union(
  v.literal("call"),
  v.literal("result")
);

export const flexibleMetadata = v.record(v.string(), v.any());

export default defineSchema({
  users: defineTable({
    // Clerk user ID (from getUserIdentity().subject)
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    tier: subscriptionTiers,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byTokenIdentifier", ["tokenIdentifier"])
    .index("byEmail", ["email"]),

  usages: defineTable({
    userId: v.id("users"),
    tokenCountTotal: v.number(),
    tokenCountSinceLastReset: v.number(),
    messagesCountTotal: v.number(),
    messagesCountSinceLastReset: v.number(),
    lastResetDate: v.number(),
    updatedAt: v.number(),
  }).index("byUserId", ["userId"]),

  threads: defineTable({
    userId: v.id("users"),
    uuid: v.string(),
    title: v.optional(v.string()),
    status: threadLifecycleStatuses,
    liveState: threadLiveStates,
    createdAt: v.number(),
    updatedAt: v.number(),
    messages: v.string(),

    // AI SDK v4: Enhanced metadata for thread management
    metadata: v.optional(
      v.object({
        lastUsedModel: aiModels,
        lastUsedProvider: aiModelProviders,
        messageCount: v.optional(v.number()),
        totalTokens: v.optional(v.number()),
        lastMessagePreview: v.optional(v.string()), // For sidebar display
      })
    ),
  })
    .index("byUserId", ["userId"])
    // .index("byParentThreadId", ["parentThreadId"]) // for forking/branching (outside of MVP scope)
    // .index("byWorkspaceId", ["workspaceId"]) // for future workspace feature (outside of MVP scope)
    .index("byUserIdUpdatedAt", ["userId", "updatedAt"])
    .index("byUuid", ["uuid"]),
  // .index("byWorkspaceIdUpdatedAt", ["workspaceId", "updatedAt"]) // for future workspace feature (outside of MVP scope)

  // TODO: outside of MVP scope
  // workspaces: defineTable({
  //   name: v.string(),
  //   description: v.optional(v.string()),
  //   userId: v.id("users"),
  //   // todo: add some workspace-context data
  //   createdAt: v.number(),
  //   updatedAt: v.number(),
  // }).index("byUserId", ["userId"]),

  // files: defineTable({
  //   userId: v.id("users"),
  //   storageId: v.id("_storage"), // Convex file storage ID
  //   threadId: v.optional(v.id("threads")), // if file belongs to a thread
  //   messageId: v.optional(v.id("messages")), // if file belongs to a message
  //   workspaceId: v.optional(v.id("workspaces")), // if file belongs to a workspace
  //   name: v.string(),
  //   mimeType: v.string(),
  //   byteSize: v.number(),
  //   metadata: v.optional(flexibleMetadata),
  //   createdAt: v.number(),
  //   updatedAt: v.number(),
  // })
  //   .index("byThreadId", ["threadId"])
  //   .index("byMessageId", ["messageId"])
  //   .index("byWorkspaceId", ["workspaceId"]),

  // threadSnapshots: defineTable({
  //   threadId: v.id("threads"),
  //   snapshotData: v.any(), // serialized thread state
  //   createdBy: v.id("users"),
  //   description: v.optional(v.string()), // what changed
  //   snapshotType: v.union(
  //     v.literal("manual"), // user-created snapshot
  //     v.literal("auto"), // automatic snapshot
  //     v.literal("fork") // snapshot created when forking
  //   ),
  //   createdAt: v.number(),
  //   updatedAt: v.number(),
  // })
  //   .index("byThreadId", ["threadId"])
  //   .index("byThreadIdCreatedAt", ["threadId", "createdAt"]),

  // Thread forks/branches (for future branching feature)
  // threadBranches: defineTable({
  //   sourceThreadId: v.id("threads"),
  //   targetThreadId: v.id("threads"),
  //   userId: v.id("users"),
  //   branchPoint: v.number(), // message sequence where branch occurred
  //   reason: v.optional(v.string()), // why was this branch created
  // })
  //   .index("bySourceThreadId", ["sourceThreadId"])
  //   .index("byTargetThreadId", ["targetThreadId"]),
});
