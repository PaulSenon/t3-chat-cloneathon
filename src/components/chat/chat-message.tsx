"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, SquarePen, RefreshCcw } from "lucide-react";
import { UIMessage } from "ai";

interface ChatMessageProps {
  message: UIMessage;
  onRetry?: () => void;
  onEdit?: () => void;
  isStale: boolean;
  isOptimistic: boolean;
  isLoading: boolean;
}

/**
 * Clean chat message component matching the reference design
 */
export const ChatMessage = React.memo(function ChatMessage({
  message,
  onRetry,
  onEdit,
  isStale,
  isOptimistic,
  isLoading,
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
          {message.parts.map((part, i) => {
            console.log(part.type, part);
            switch (part.type) {
              case "text":
                return (
                  <div
                    key={i}
                    className="prose prose-pink max-w-none dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0"
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                  </div>
                );
              case "step-start":
                return isOptimistic && <AssistantLoading key={i} />;
              case "source":
                const { sourceType, url, title } = part.source;
                return (
                  sourceType === "url" && (
                    <div key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {title}
                      </a>
                    </div>
                  )
                );
              case "reasoning":
                return (
                  <div key={i}>
                    {isLoading ? "REASONING..." : part.reasoning}
                  </div>
                );
              case "tool-invocation":
                const { toolName, state: toolState } = part.toolInvocation;
                return (
                  <div key={i}>
                    {toolName}
                    {toolState === "call"
                      ? "TOOL INVOCATION"
                      : toolState === "partial-call"
                        ? "TOOL PARTIAL CALL"
                        : toolState === "result"
                          ? "TOOL RESULT"
                          : "TOOL ERROR"}
                  </div>
                );

              // case "file":
              //   return <div key={i}>FILE</div>;
            }
          })}
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

const AssistantLoading = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex", className)}>
      <div
        role="article"
        aria-label="Assistant is thinking..."
        className={cn(
          "group relative inline-block max-w-[80%] break-words rounded-xl px-4 py-3 text-left transition-discrete duration-250",
          "bg-transparent"
        )}
      >
        <div className="flex items-center gap-1">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
          </div>
          {/* <span className="ml-2 text-sm text-muted-foreground/80">
            Thinking...
          </span> */}
        </div>
      </div>
    </div>
  );
};
