import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const subscriptionTiers = v.union(
  v.literal("free"),
  v.literal("premium-level-1")
);

export const aiModelProviders = v.union(
  v.literal("openai"),
  v.literal("anthropic")
);
export const aiModels = v.string();

export const threadLifecycleStatuses = v.union(
  v.literal("active"),
  v.literal("archived"),
  v.literal("deleted")
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

export const messagePartTypes = v.union(
  v.literal("text"),
  v.literal("file"),
  v.literal("tool-call"),
  v.literal("tool-result"),
  v.literal("reasoning"), // for reasoning models
  v.literal("source"), // for source citations
  v.literal("data") // for custom data parts
);

export const flexibleMetadata = v.record(v.string(), v.any());

// ✅ PERMANENT - Stripe subscription statuses (exact from Stripe API)
export const stripeSubscriptionStatuses = v.union(
  v.literal("active"),
  v.literal("canceled"), 
  v.literal("incomplete"),
  v.literal("incomplete_expired"),
  v.literal("past_due"),
  v.literal("trialing"),
  v.literal("unpaid"),
  v.literal("paused")
);

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
    // parentThreadId: v.optional(v.id("threads")), // for forking/branching (outside of MVP scope)
    // workspaceId: v.optional(v.id("workspaces")), // for future workspace feature (outside of MVP scope)
    title: v.optional(v.string()),
    status: threadLifecycleStatuses,
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(
      v.object({
        lastUsedModel: aiModels,
        lastUsedProvider: aiModelProviders,
      })
    ),
  })
    .index("byUserId", ["userId"])
    // .index("byParentThreadId", ["parentThreadId"]) // for forking/branching (outside of MVP scope)
    // .index("byWorkspaceId", ["workspaceId"]) // for future workspace feature (outside of MVP scope)
    .index("byUserIdUpdatedAt", ["userId", "updatedAt"]),
  // .index("byWorkspaceIdUpdatedAt", ["workspaceId", "updatedAt"]) // for future workspace feature (outside of MVP scope)

  messages: defineTable({
    threadId: v.id("threads"),
    userId: v.id("users"), // Direct ownership for efficient RLS
    role: aiMessageRoles,
    parts: v.array(
      v.object({
        type: messagePartTypes,
        // Content is flexible to handle different part types
        content: v.any(),
        // Optional metadata for each part
        metadata: v.optional(flexibleMetadata),
      })
    ),
    sequenceNumber: v.number(),
    parentMessageId: v.optional(v.id("messages")),
    provider: v.optional(aiModelProviders),
    model: v.optional(aiModels),
    usage: v.object({
      tokenCount: v.number(),
      toolCallCount: v.number(),
    }),
    status: messageLifecycleStatuses,
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(flexibleMetadata),
  })
    .index("byThreadId", ["threadId"])
    .index("byUserId", ["userId"]) // Direct user ownership index
    .index("byThreadIdSequenceNumber", ["threadId", "sequenceNumber"])
    .index("byParentMessageId", ["parentMessageId"]),

  // ✅ PERMANENT - Stripe customer mappings (minimal data for ACID compliance)
  stripeCustomers: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(), // Stripe's customer ID (authoritative)
    email: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byStripeCustomerId", ["stripeCustomerId"]),

  // ✅ PERMANENT - Subscription state cache (minimal data to avoid split-brain)
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeSubscriptionId: v.string(), // Stripe's subscription ID (authoritative) 
    stripeCustomerId: v.string(),     // FK to Stripe customer
    status: stripeSubscriptionStatuses, // Stripe's exact status values
    priceId: v.string(),              // Stripe's price ID
    tier: subscriptionTiers,          // Computed from priceId for performance
    currentPeriodEnd: v.number(),     // Unix timestamp for business logic
    cancelAtPeriodEnd: v.boolean(),   // For UI warning messages
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byStripeSubscriptionId", ["stripeSubscriptionId"])
    .index("byStatus", ["status"])
    .index("byTier", ["tier"]),

  // ✅ PERMANENT - Webhook event log for reliability and debugging
  stripeWebhookEvents: defineTable({
    stripeEventId: v.string(),        // Stripe's event ID (idempotency)
    eventType: v.string(),            // e.g. "customer.subscription.updated"
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("byStripeEventId", ["stripeEventId"])
    .index("byProcessed", ["processed"])
    .index("byEventType", ["eventType"]),

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
