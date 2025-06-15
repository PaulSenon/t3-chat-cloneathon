"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, SquarePen, RefreshCcw } from "lucide-react";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onEdit?: () => void;
  isStale: boolean;
}

/**
 * Clean chat message component matching the reference design
 */
export const ChatMessage = React.memo(function ChatMessage({
  message,
  onRetry,
  onEdit,
  isStale,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  /**
   * Copy message content to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <div className={cn("flex", isUser && "justify-end")}>
      <div
        role="article"
        aria-label={isUser ? "Your message" : "Assistant message"}
        className={cn(
          "group relative inline-block max-w-[80%] break-words rounded-xl px-4 py-3 text-left transition-discrete duration-250",
          isUser
            ? "border border-secondary/50 bg-secondary/50"
            : "bg-transparent",
          isStale && "opacity-50"
        )}
      >
        <span className="sr-only">
          {isUser ? "Your message: " : "Assistant message: "}
        </span>

        <div className="flex flex-col gap-3">
          <div className="prose prose-pink max-w-none dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0">
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>
        </div>

        {/* Action buttons - only show on hover */}
        <div className="absolute right-0 mt-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {isUser && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 text-xs hover:bg-muted/40 hover:border-transparent border-transparent"
              onClick={onRetry}
              aria-label="Retry message"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="sr-only">Retry</span>
            </Button>
          )}

          {isUser && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 text-xs hover:bg-muted/40 hover:border-transparent border-transparent"
              onClick={onEdit}
              aria-label="Edit message"
            >
              <SquarePen className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-lg p-0 text-xs hover:bg-muted/40 hover:border-transparent border-transparent"
            onClick={handleCopy}
            aria-label="Copy message"
          >
            <div className="relative size-4">
              <Copy
                className={cn(
                  "absolute inset-0 transition-all duration-200",
                  copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                )}
              />
              <Check
                className={cn(
                  "absolute inset-0 transition-all duration-200",
                  copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                )}
              />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
});
