"use client";

import TmpChatInput from "./tmp-chat-input";
import { BotIcon } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { useEffect } from "react";
import { useChatState } from "@/providers/ChatStateProvider";
import {
  useChatThreadActions,
  useChatThreadState,
} from "@/providers/ChatThreadProvider";

export function Chat() {
  const { currentThreadId, isNewThread } = useChatState();

  const { input, messages, isStale, isLoading } = useChatThreadState();

  const { handleInputChange, handleSubmit } = useChatThreadActions();

  useEffect(() => {
    console.log("------------- messages", messages);
  }, [messages]);

  // simplified rendering code, extend as needed:
  return (
    <div className="h-screen w-full overflow-y-scroll overscroll-contain">
      <div className="max-w-3xl mx-auto space-y-5 p-4">
        <div className="aria-hidden h-10"></div>
        <div className="text-sm text-muted-foreground">
          {currentThreadId ?? "null"} {messages.length} {messages?.length}
        </div>

        {isNewThread ? (
          <NewChatPlaceholder />
        ) : isLoading ? (
          <LoadingChatPlaceholder />
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              isStale={isStale}
              message={{
                id: message.id,
                content: message.content,
                role: message.role as "user" | "assistant",
                timestamp: message.createdAt,
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
        disabled={isLoading}
      />
    </div>
  );
}

const NewChatPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">Start a new conversation</h2>
      <p className="text-muted-foreground">Send a message to begin chatting.</p>
    </div>
  );
};

const LoadingChatPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted mb-4" />
      <h2 className="text-lg font-semibold mb-2 text-muted">Loading...</h2>
    </div>
  );
};
