"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserIcon, BotIcon } from "lucide-react";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

/**
 * Simple chat message component
 *
 * Basic features:
 * - Clean message display
 * - Simple avatars
 * - Copy functionality
 * - Minimal styling
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
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {isUser ? (
            <UserIcon className="h-4 w-4" />
          ) : (
            <BotIcon className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            isUser && "flex-row-reverse"
          )}
        >
          <span className="font-medium">{isUser ? "You" : "Assistant"}</span>
        </div>

        <div
          className={cn(
            "rounded-lg px-3 py-2 max-w-[80%]",
            isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
          )}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    </div>
  );
});
