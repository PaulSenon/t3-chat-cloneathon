"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MenuIcon,
  SendIcon,
  UserIcon,
  BotIcon,
  PaperclipIcon,
  MicIcon,
} from "lucide-react";
import { ChatMessage } from "./chat-message";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { convexToAIMessages } from "@/lib/message-utils";
import type { Id } from "../../../convex/_generated/dataModel";

interface ChatInterfaceProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  threadId: Id<"threads">;
}

/**
 * Main chat interface component
 *
 * Features:
 * - Real-time AI chat with streaming responses
 * - Message persistence via Convex RLS
 * - Chat input with auto-resize
 * - File attachment support (TODO)
 * - Voice input support (TODO)
 * - Responsive design
 *
 * Performance considerations:
 * - Uses main page scroll instead of container overflow for better performance
 * - Implements auto-scrolling to bottom on new messages
 * - Optimized for streaming message display
 * - Prepared for future virtual scrolling implementation
 */
export function ChatInterface({
  sidebarOpen,
  onToggleSidebar,
  threadId,
}: ChatInterfaceProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load existing messages from Convex
  const convexMessages = useQuery(api.messages.getThreadMessages, {
    threadId,
    paginationOpts: { numItems: 50, cursor: null },
  });

  // Convert Convex messages to AI SDK format
  const initialMessages = React.useMemo(() => {
    if (!convexMessages?.page) return [];
    return convexToAIMessages(convexMessages.page);
  }, [convexMessages]);

  // AI SDK chat hook - Updated with latest v4 patterns
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    error,
    reload,
  } = useChat({
    api: "/api/chat",
    id: threadId,
    initialMessages,
    // Use data stream protocol (default, but being explicit)
    streamProtocol: "data",
    // Send extra message fields like id and createdAt for proper persistence
    sendExtraMessageFields: true,
    // Enhanced error handling
    onError: (error) => {
      console.error("Chat error:", error);
    },
    // Optional: Add finish callback for analytics/logging
    onFinish: (message, { usage, finishReason }) => {
      console.log("Message completed:", {
        messageId: message.id,
        usage,
        finishReason,
      });
    },
  });

  // Computed loading states based on status
  const isLoading = status === "submitted" || status === "streaming";
  const isStreaming = status === "streaming";

  // Track if user is at bottom to prevent scroll jumping during streaming
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  /**
   * Smart auto-scroll that only scrolls when user is at bottom
   * Prevents interrupting user's scroll during streaming
   */
  const scrollToBottom = React.useCallback(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [shouldAutoScroll]);

  /**
   * Check if user is at bottom of scroll container
   */
  const checkIfAtBottom = React.useCallback(() => {
    const threshold = 150; // pixels from bottom
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    const isNearBottom = scrollTop + windowHeight >= documentHeight - threshold;
    setIsAtBottom(isNearBottom);
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Monitor scroll position to determine auto-scroll behavior
  React.useEffect(() => {
    const handleScroll = () => {
      checkIfAtBottom();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    checkIfAtBottom(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [checkIfAtBottom]);

  // Smart auto-scroll: only when at bottom
  React.useEffect(() => {
    if (messages.length > 0) {
      // Always scroll for new user messages
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "user") {
        setShouldAutoScroll(true);
        scrollToBottom();
      } else if (shouldAutoScroll) {
        // Only auto-scroll for AI messages if user is at bottom
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom, shouldAutoScroll]);

  /**
   * Handle form submission
   */
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  // Show loading state while messages are being fetched
  if (convexMessages === undefined) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Minimalist */}
      <header className="flex items-center gap-3 px-4 py-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden h-8 w-8"
        >
          <MenuIcon className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 flex-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Chat</span>
        </div>

        {/* Minimal status and controls */}
        <div className="flex items-center gap-2">
          {isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              className="text-xs h-7 px-2"
            >
              Stop
            </Button>
          )}
          <div className="text-xs text-muted-foreground/70">
            {status === "streaming" ? "●" : "○"}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-1 p-4 pb-20">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={{
                    id: message.id,
                    content: message.content,
                    role: message.role as "user" | "assistant",
                    timestamp: message.createdAt || new Date(),
                    isStreaming: isStreaming && message.role === "assistant",
                  }}
                />
              ))}

              {/* Enhanced error display with retry option */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
                  <div className="text-red-700 text-sm">
                    <p className="font-medium">Error: {error.message}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reload()}
                      className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {/* Invisible div for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* New Messages Indicator - Shows when user scrolled up */}
        {!isAtBottom && messages.length > 0 && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShouldAutoScroll(true);
                scrollToBottom();
              }}
              className="shadow-lg bg-background/95 backdrop-blur-sm border"
            >
              ↓ New messages
            </Button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={onSubmit} className="flex gap-3 items-end">
            {/* Attachment button */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              disabled={isLoading}
              type="button"
            >
              <PaperclipIcon className="h-4 w-4" />
            </Button>

            {/* Message input */}
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="min-h-[20px] max-h-32 resize-none"
                disabled={status !== "ready"}
              />
            </div>

            {/* Voice input button */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              disabled={isLoading}
              type="button"
            >
              <MicIcon className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Button
              type="submit"
              disabled={!input.trim() || status !== "ready"}
              size="icon"
              className="flex-shrink-0"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>

          {/* Enhanced input footer with status */}
          <div className="text-xs text-muted-foreground mt-2 text-center">
            {status === "streaming" && "AI is responding..."}
            {status === "submitted" && "Message sent..."}
            {status === "ready" &&
              "AI can make mistakes. Consider checking important information."}
            {status === "error" && "Something went wrong. Please try again."}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component shown when there are no messages
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="max-w-md">
        <div className="mb-4">
          <BotIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
        </div>

        <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>

        <p className="text-muted-foreground mb-6">
          Ask me anything! I can help with coding, writing, analysis, and more.
        </p>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1 h-1 bg-current rounded-full" />
            <span>Ask questions and get detailed answers</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1 h-1 bg-current rounded-full" />
            <span>Get help with coding and technical topics</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1 h-1 bg-current rounded-full" />
            <span>Analyze and discuss complex topics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
