import type { Message as AIMessage } from "ai/react";

// Types for Convex message parts
interface MessagePart {
  type:
    | "text"
    | "file"
    | "tool-call"
    | "tool-result"
    | "reasoning"
    | "source"
    | "data";
  content: unknown;
  metadata?: Record<string, unknown>;
}

// Convex message type
interface ConvexMessage {
  _id: string;
  threadId: string;
  userId: string;
  role: "user" | "assistant" | "system" | "tool";
  parts: MessagePart[];
  sequenceNumber: number;
  parentMessageId?: string;
  provider?: "openai" | "anthropic";
  model?: string;
  usage: {
    tokenCount: number;
    toolCallCount: number;
  };
  status: "pending" | "streaming" | "completed" | "error" | "cancelled";
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * Convert Convex messages to AI SDK messages
 */
export function convexToAIMessages(
  convexMessages: ConvexMessage[]
): AIMessage[] {
  return convexMessages
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    .map((message) => {
      // Extract text content from parts
      const textParts = message.parts.filter((part) => part.type === "text");
      const content =
        textParts.length > 0
          ? textParts.map((part) => part.content).join("")
          : "";

      return {
        id: message._id,
        role: message.role as "user" | "assistant" | "system",
        content,
        createdAt: new Date(message.createdAt),
      };
    });
}

/**
 * Convert AI SDK message to Convex message parts
 */
export function aiMessageToConvexParts(message: AIMessage): MessagePart[] {
  return [
    {
      type: "text",
      content: message.content,
    },
  ];
}

/**
 * Create a temporary AI SDK message for optimistic updates
 */
export function createOptimisticMessage(
  content: string,
  role: "user" | "assistant" = "user"
): AIMessage {
  return {
    id: `temp-${Date.now()}-${crypto.randomUUID()}`,
    role,
    content,
    // Don't include createdAt to avoid Convex date type issues
  };
}
