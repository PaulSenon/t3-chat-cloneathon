"use client";

import { Message, useChat } from "@ai-sdk/react";
import TmpChatInput from "./tmp-chat-input";
import { BotIcon } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import superjson from "superjson";
import { useAuth } from "@/hooks/useAuth";

type ChatProps = {
  threadId?: string;
};

export default function Chat({ threadId }: ChatProps = {}) {
  const { isAuthenticated } = useAuth();
  const thread = useQuery(
    api.chat.getChat,
    isAuthenticated && threadId ? { uuid: threadId } : "skip"
  );

  const initialMessages = thread?.messages
    ? (superjson.parse(thread.messages) as Message[])
    : [];

  const { input, handleInputChange, handleSubmit, messages } = useChat({
    api: "/api/chat",
    id: threadId, // use the provided chat ID
    initialMessages, // initial messages if provided
    sendExtraMessageFields: true, // send id and createdAt for each message
    // only send the last message to the server:
    experimental_prepareRequestBody({ messages, id }) {
      return { message: messages[messages.length - 1], id };
    },
  });

  // simplified rendering code, extend as needed:
  return (
    <div className="h-screen w-full overflow-y-scroll overscroll-contain">
      <div className="max-w-3xl mx-auto space-y-5 p-4">
        <div className="aria-hidden h-10"></div>

        {messages.length === 0 ? (
          <EmptyChatPlaceholder />
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={{
                id: message.id,
                content: message.content,
                role: message.role as "user" | "assistant",
                timestamp: new Date(), // Use current time since we stripped createdAt
              }}
            />
          ))
        )}
        <div className="aria-hidden h-40"></div>
      </div>

      <TmpChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={false /*TODO: add loading state */}
      />
    </div>
  );
}

const EmptyChatPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">Start a new conversation</h2>
      <p className="text-muted-foreground">Send a message to begin chatting.</p>
    </div>
  );
};
