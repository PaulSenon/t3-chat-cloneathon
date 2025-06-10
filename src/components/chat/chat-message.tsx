"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserIcon, BotIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from "lucide-react"
import { Message } from "@/types/chat"

interface ChatMessageProps {
  message: Message
}

/**
 * Individual chat message component
 * 
 * Features:
 * - Different styling for user vs assistant messages
 * - Avatar display with appropriate icons
 * - Message actions (copy, like, dislike)
 * - Streaming message support (TODO)
 * - Timestamp display
 * - Code block rendering (TODO)
 * - Markdown support (TODO)
 * 
 * Performance considerations:
 * - Memoized to prevent unnecessary re-renders
 * - Optimized for streaming content
 * - Efficient text rendering
 */
export const ChatMessage = React.memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [isHovered, setIsHovered] = React.useState(false)

  /**
   * Copy message content to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      // TODO: Show toast notification
      console.log("Message copied to clipboard")
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
  }

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(timestamp)
  }

  return (
    <div
      className={cn(
        "group flex gap-4 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className={cn(
          "h-8 w-8",
          isUser ? "bg-primary" : "bg-secondary"
        )}>
          <AvatarFallback>
            {isUser ? (
              <UserIcon className="h-4 w-4" />
            ) : (
              <BotIcon className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 space-y-2 max-w-none",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Header */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="font-medium">
            {isUser ? "You" : "Assistant"}
          </span>
          <span>{formatTime(message.timestamp)}</span>
        </div>

        {/* Message Body */}
        <div className={cn(
          "rounded-lg px-4 py-3 max-w-3xl",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted"
        )}>
          {/* TODO: Add markdown rendering */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="mt-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          )}
        </div>

        {/* Message Actions */}
        {!isUser && isHovered && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
              title="Copy message"
            >
              <CopyIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                // TODO: Implement feedback system
                console.log("Message liked:", message.id)
              }}
              title="Good response"
            >
              <ThumbsUpIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                // TODO: Implement feedback system
                console.log("Message disliked:", message.id)
              }}
              title="Poor response"
            >
              <ThumbsDownIcon className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})