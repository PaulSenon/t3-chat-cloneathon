"use client";

import TmpChatInput from "./tmp-chat-input";
import { BotIcon } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { useChatActions, useChatState } from "@/providers/ChatStateProvider";
import {
  useChatThreadActions,
  useChatThreadState,
} from "@/providers/ChatThreadProvider";
// import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

export function Chat() {
  const { currentThreadId, isNewThread, selectedModel } = useChatState();
  const { setSelectedModel } = useChatActions();
  const { input, messages, isStale, isLoading, status } = useChatThreadState();
  const { handleInputChange, handleSubmit } = useChatThreadActions();

  // const {
  //   containerRef,
  //   endRef,
  //   isAtBottom,
  //   scrollToBottom,
  //   scrollToBottomInstant,
  //   scrollToShowLastMessage,
  //   onViewportEnter,
  //   onViewportLeave,
  // } = useScrollToBottom();

  // Set up intersection observer for the end marker
  // useEffect(() => {
  //   const endElement = endRef.current;
  //   const containerElement = containerRef.current;

  //   if (!endElement || !containerElement) return;

  //   const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       if (entry.isIntersecting) {
  //         onViewportEnter();
  //       } else {
  //         onViewportLeave();
  //       }
  //     },
  //     {
  //       root: containerElement,
  //       rootMargin: "0px 0px 50px 0px",
  //       threshold: 0.1,
  //     }
  //   );

  //   observer.observe(endElement);
  //   return () => observer.disconnect();
  // }, [onViewportEnter, onViewportLeave]);

  // Scroll to bottom when thread content is loaded
  // useEffect(() => {
  //   // Only scroll when we have a real thread with messages loaded
  //   if (currentThreadId && !isNewThread && !isLoading && messages.length > 0) {
  //     scrollToBottomInstant();
  //   }
  // }, [
  //   currentThreadId,
  //   isNewThread,
  //   isLoading,
  //   messages.length,
  //   scrollToBottomInstant,
  // ]);

  // Scroll to bottom when moving from stale to fresh data
  // useEffect(() => {
  //   if (!isStale && messages.length > 0) {
  //     scrollToBottomInstant();
  //   }
  // }, [isStale, messages.length, scrollToBottomInstant]);

  // No auto-scroll during streaming - user explicitly doesn't want this

  // simplified rendering code, extend as needed:
  return (
    <div
      // ref={containerRef}
      className="h-screen w-full overflow-y-scroll overscroll-contain"
    >
      <div className="max-w-3xl mx-auto space-y-5 p-4">
        <div className="aria-hidden h-10"></div>
        <div className="text-sm text-muted-foreground">
          {currentThreadId ?? "null"} {messages.length} {messages?.length}
        </div>

        {isNewThread ? (
          <NewChatPlaceholder />
        ) : isLoading && messages.length === 0 ? (
          <LoadingChatPlaceholder />
        ) : (
          messages.map((message) => (
            <div key={message.id} data-message-role={message.role}>
              <ChatMessage
                isStale={isStale}
                message={{
                  id: message.id,
                  content: message.content,
                  role: message.role as "user" | "assistant",
                  timestamp: message.createdAt,
                }}
              />
            </div>
          ))
        )}
        <div className="aria-hidden h-40"></div>
      </div>

      <TmpChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={(e) => {
          handleSubmit(e);
          // scrollToShowLastMessage();
        }}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isLoading={isLoading}
        showScrollToBottom={true}
        onScrollToBottomClick={() => {}}
        isStreaming={status === "streaming" || status === "submitted"}
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
