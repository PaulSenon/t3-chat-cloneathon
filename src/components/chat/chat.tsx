"use client";

import TmpChatInput from "./tmp-chat-input";
import { BotIcon } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { useChatActions, useChatState } from "@/providers/ChatStateProvider";
import {
  useChatThreadActions,
  useChatThreadState,
} from "@/providers/ChatThreadProvider";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
// import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

export type OptimisticMessage = UIMessage & {
  isOptimistic?: true;
};

const createOptimisticStepStartMessage = (): OptimisticMessage => ({
  id: Date.now().toString(),
  role: "assistant",
  parts: [
    {
      type: "step-start",
    },
  ],
  createdAt: new Date(),
  isOptimistic: true,
  content: "",
});

export function Chat() {
  const {
    currentThreadId,
    isNewThread,
    selectedModel,
    hasSubmittedSinceCurrentThreadLoaded,
  } = useChatState();
  const { setSelectedModel } = useChatActions();
  const {
    input,
    messages,
    isStale,
    isLoading: isLoadingThreadData,
    status,
  } = useChatThreadState();
  const { handleInputChange, handleSubmit } = useChatThreadActions();

  const isWaitingForFirstToken =
    status === "submitted" &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";

  const isStreaming = status === "streaming";
  const isStreamingOptimistic = isWaitingForFirstToken || isStreaming;

  const optimisticMessages: OptimisticMessage[] = isWaitingForFirstToken
    ? [...messages, createOptimisticStepStartMessage()]
    : messages;
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
      <div className="max-w-3xl mx-auto p-4">
        <div className="aria-hidden h-5"></div>

        {isNewThread ? (
          <NewChatPlaceholder />
        ) : isLoadingThreadData && messages.length === 0 ? (
          <LoadingChatPlaceholder />
        ) : (
          <>
            {optimisticMessages.map((message, index) => {
              const isLastMessage = index === optimisticMessages.length - 1;

              const isLastMessageAndAssistant =
                isLastMessage && message.role === "assistant";

              const isCurrentMessageStreaming =
                isLastMessageAndAssistant && isStreamingOptimistic;

              return (
                <div
                  key={message.id}
                  data-message-role={message.role}
                  className={cn(
                    message.role === "assistant" &&
                      hasSubmittedSinceCurrentThreadLoaded &&
                      "nth-last-2:min-h-[calc(100vh-20rem)]"
                  )}
                >
                  <ChatMessage
                    isStale={isStale}
                    message={message}
                    isStreaming={isCurrentMessageStreaming}
                  />
                </div>
              );
            })}
          </>
        )}
        <div className="aria-hidden h-40"></div>
      </div>

      <TmpChatInput
        isStale={isStale}
        input={input}
        onChange={handleInputChange}
        onSubmit={(e) => {
          handleSubmit(e);
          // scrollToShowLastMessage();
        }}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isLoading={isLoadingThreadData}
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
