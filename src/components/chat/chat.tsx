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
import { WelcomeChat } from "./welcom-chat";
import { useAuth } from "@/hooks/useAuth";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { useEffect, useRef } from "react";
import { useLayoutEffect } from "react";
import { Button } from "../ui/button";
import { LoaderAnimation } from "./chat-message";
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
  const { isFullyReady } = useAuth();
  const {
    isNewThread,
    selectedModel,
    hasSubmittedSinceCurrentThreadLoaded,
    currentThread,
  } = useChatState();
  const { setSelectedModel } = useChatActions();
  const {
    input,
    messages,
    isStale,
    isLoading: isLoadingThreadData,
    status,
  } = useChatThreadState();
  const { handleInputChange, handleSubmit, reload } = useChatThreadActions();

  const isWaitingForFirstToken =
    status === "submitted" &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";

  const isStreaming = status === "streaming";
  const isStreamingOptimistic = isWaitingForFirstToken || isStreaming;

  const optimisticMessages: OptimisticMessage[] = isWaitingForFirstToken
    ? [...messages, createOptimisticStepStartMessage()]
    : messages;
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    scrollToBottomInstant,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  // Set up intersection observer for the end marker
  useEffect(() => {
    const endElement = endRef.current;
    const containerElement = containerRef.current;

    if (!endElement || !containerElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onViewportEnter();
        } else {
          onViewportLeave();
        }
      },
      {
        root: containerElement,
        rootMargin: "0px 0px 50px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(endElement);
    return () => observer.disconnect();
  }, [onViewportEnter, onViewportLeave, endRef, containerRef]);

  // Alternative: Direct scroll on message changes (more aggressive)
  // useLayoutEffect(() => {
  //   if (isStreamingOptimistic && isAtBottom && !isLoadingThreadData) {
  //     scrollToBottomInstant();
  //   }
  // }, [
  //   messages.length,
  //   isStreamingOptimistic,
  //   isAtBottom,
  //   scrollToBottomInstant,
  //   isLoadingThreadData,
  // ]);

  const hasRendered = useRef(false);
  useLayoutEffect(() => {
    if (hasRendered.current) return;
    if (isLoadingThreadData) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottomInstant();
      });
      hasRendered.current = true;
    });
  }, [scrollToBottomInstant, isLoadingThreadData]);

  // Initial scroll to bottom when thread loads
  // const hasAlreadyScrolledToBottom = useRef(false);
  // useLayoutEffect(() => {
  //   if (
  //     !isAtBottom &&
  //     !hasAlreadyScrolledToBottom.current &&
  //     !isLoadingThreadData
  //   ) {
  //     hasAlreadyScrolledToBottom.current = true;
  //     requestAnimationFrame(() => {
  //       scrollToBottomInstant();
  //     });
  //   }
  // }, [isLoadingThreadData, isAtBottom, scrollToBottomInstant]);

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
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll overscroll-contain"
    >
      <div className="max-w-3xl mx-auto p-4">
        <div className="aria-hidden h-20"></div>
        {isNewThread ? (
          <WelcomeChat />
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
                    "opacity-0 transition-opacity duration-200 ease-in",
                    hasRendered.current && "opacity-100",
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
        {!isStreamingOptimistic && (
          <>
            {/* TODO: fix flickering */}
            {/* {currentThread?.liveState === "streaming" && (
              <StreamLiveStatePending />
            )} */}
            {currentThread?.liveState === "error" && (
              <StreamLiveStateError reload={reload} />
            )}
          </>
        )}
        <div className="aria-hidden h-40" ref={endRef}></div>
      </div>

      <TmpChatInput
        isStale={isStale}
        input={input}
        onChange={handleInputChange}
        onSubmit={(e) => {
          handleSubmit(e);
          scrollToBottomInstant();
        }}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isLoading={isLoadingThreadData}
        showScrollToBottom={!isAtBottom}
        onScrollToBottomClick={() => scrollToBottom()}
        isStreaming={status === "streaming" || status === "submitted"}
        disabled={!isFullyReady}
      />
    </div>
  );
}

const LoadingChatPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted mb-4" />
      <h2 className="text-lg font-semibold mb-2 text-muted">Loading...</h2>
    </div>
  );
};

const StreamLiveStatePending = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted mb-4" />
      <h2 className="text-lg font-semibold mb-2 text-muted">
        We are resuming your stream, please wait...
      </h2>
      <LoaderAnimation />
    </div>
  );
};

const StreamLiveStateError = ({ reload }: { reload: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted mb-4" />
      <h2 className="text-lg font-semibold mb-2 text-muted">
        Sorry, something went wrong. Please try again.
      </h2>
      <Button variant="outline" onClick={reload}>
        Try again
      </Button>
    </div>
  );
};
