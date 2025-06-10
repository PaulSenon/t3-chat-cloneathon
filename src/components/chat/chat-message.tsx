"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  UserIcon,
  BotIcon,
  CopyIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "lucide-react";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

/**
 * Individual chat message component - Zero CLS Design
 *
 * Features:
 * - Zero Cumulative Layout Shift (CLS) during interactions
 * - Minimalist flat design with reserved action space
 * - Smooth streaming message support
 * - Performance optimized for 60fps scrolling
 */
export const ChatMessage = React.memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  /**
   * Copy message content to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      console.log("Message copied to clipboard");
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(timestamp);
  };

  return (
    <div
      className={cn(
        "group flex gap-3 w-full py-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar - Simplified */}
      <div className="flex-shrink-0 mt-1">
        <div
          className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center text-xs",
            isUser
              ? "bg-foreground text-background"
              : "bg-muted-foreground/10 text-muted-foreground"
          )}
        >
          {isUser ? (
            <UserIcon className="h-3 w-3" />
          ) : (
            <BotIcon className="h-3 w-3" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div
        className={cn("flex-1 min-w-0", isUser ? "text-right" : "text-left")}
      >
        {/* Message Body - Flat Design */}
        <div
          className={cn(
            "inline-block max-w-[85%] px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "bg-foreground text-background rounded-2xl rounded-tr-md"
              : "bg-muted/50 text-foreground rounded-2xl rounded-tl-md"
          )}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Minimalist streaming indicator */}
          {message.isStreaming && (
            <div className="mt-1 flex justify-end">
              <div className="w-1 h-3 bg-current/30 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Timestamp and Actions Row - ALWAYS rendered (Zero CLS) */}
        <div
          className={cn(
            "flex items-center gap-2 mt-1 h-5", // Fixed height prevents CLS
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* Timestamp */}
          <span className="text-xs text-muted-foreground/60">
            {formatTime(message.timestamp)}
          </span>

          {/* Action Buttons - Always reserve space */}
          {!isUser && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-muted"
                onClick={handleCopy}
                title="Copy"
              >
                <CopyIcon className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-muted"
                onClick={() => console.log("Message liked:", message.id)}
                title="Like"
              >
                <ThumbsUpIcon className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-muted"
                onClick={() => console.log("Message disliked:", message.id)}
                title="Dislike"
              >
                <ThumbsDownIcon className="h-2.5 w-2.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
