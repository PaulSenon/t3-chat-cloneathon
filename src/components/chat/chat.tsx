"use client";

import { Message, useChat } from "@ai-sdk/react";
import TmpChatInput from "./tmp-chat-input";
import { BotIcon } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { useChatCache } from "@/providers/ChatCacheProvider";
import { Preloaded } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useColdCachedQuery } from "@/hooks/useColdCachedQuery";
import { useMemo } from "react";
import { parseMessages } from "@/lib/parser";
import { useHotCachedQuery } from "@/hooks/useHotCachedQuery";

interface ChatProps {
  threadPromise: Preloaded<typeof api.chat.getChat> | null;
}

export default function Chat({ threadPromise }: ChatProps) {
  const { currentThreadId } = useChatCache();
  // const test = usePreloadedQuery(threadPromise);

  const { data: currentThread, isStale } = useColdCachedQuery(
    // const isStale = false;
    // const currentThread = useHotCachedQuery(
    api.chat.getChat,
    currentThreadId
      ? {
          uuid: currentThreadId,
        }
      : "skip"
  );

  const initialMessages: Message[] = useMemo(() => {
    if (!currentThread) return [];
    if (!currentThread.messages) return [];
    return parseMessages(currentThread.messages);
  }, [currentThread]);

  const { input, handleInputChange, handleSubmit, messages, reload } = useChat({
    api: "/api/chat",
    id: currentThreadId, // use the provided chat ID
    initialMessages, // initial messages if provided
    sendExtraMessageFields: true, // send id and createdAt for each message
    // only send the last message to the server:
    experimental_prepareRequestBody({ messages, id }) {
      return { message: messages[messages.length - 1], id };
    },

    onResponse: async (response) => {
      // Handle new thread creation
      const threadId = response.headers.get("X-Thread-Id");
      console.log("threadId", threadId);
    },
  });

  // simplified rendering code, extend as needed:
  return (
    <div className="h-screen w-full overflow-y-scroll overscroll-contain">
      <div className="max-w-3xl mx-auto space-y-5 p-4">
        <div className="aria-hidden h-10"></div>
        <div className="text-sm text-muted-foreground">
          {currentThreadId ?? "null"}
        </div>

        {currentThread === undefined ? (
          <LoadingChatPlaceholder />
        ) : messages.length === 0 && !currentThreadId ? (
          <EmptyChatPlaceholder />
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              isStale={isStale}
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

const LoadingChatPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted mb-4" />
      <h2 className="text-lg font-semibold mb-2 text-muted">Loading...</h2>
    </div>
  );
};
