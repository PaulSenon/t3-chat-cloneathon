"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusIcon, MessageSquareIcon, MoreHorizontalIcon, PenToolIcon, TrashIcon } from "lucide-react"
import { Conversation } from "@/types/chat"

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

/**
 * Mock conversation data
 * TODO: Replace with actual data from Convex
 */
const mockConversations: Conversation[] = [
  { id: "1", title: "Building a React App", timestamp: "2 hours ago", isActive: true },
  { id: "2", title: "TypeScript Best Practices", timestamp: "Yesterday" },
  { id: "3", title: "Next.js 15 Features", timestamp: "3 days ago" },
  { id: "4", title: "Convex Database Setup", timestamp: "1 week ago" },
  { id: "5", title: "Tailwind CSS Tips", timestamp: "1 week ago" },
  { id: "6", title: "shadcn/ui Components", timestamp: "2 weeks ago" },
]

/**
 * Chat sidebar component
 * 
 * Features:
 * - Responsive design (collapses on mobile)
 * - Conversation history with timestamps
 * - New chat button
 * - Conversation management (edit/delete)
 * - Smooth animations and transitions
 * 
 * Performance considerations:
 * - Uses ScrollArea for efficient rendering of long conversation lists
 * - Implements hover states for better UX
 * - Optimized for both desktop and mobile interactions
 */
export function ChatSidebar({ isOpen, onToggle }: ChatSidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-muted/50 border-r transition-all duration-300 ease-in-out",
        isOpen ? "w-80" : "w-0 overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={() => {
            // TODO: Create new conversation
            console.log("Creating new conversation...")
          }}
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          {mockConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          {/* TODO: Add user settings, model selection, etc. */}
          Settings & Model Selection
        </div>
      </div>
    </div>
  )
}

/**
 * Individual conversation item component
 * 
 * Features:
 * - Hover states with action buttons
 * - Active state highlighting
 * - Truncated text with ellipsis
 * - Action buttons (edit, delete)
 */
function ConversationItem({ conversation }: { conversation: Conversation }) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
        "hover:bg-accent",
        conversation.isActive && "bg-accent"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        // TODO: Navigate to conversation
        console.log(`Opening conversation: ${conversation.id}`)
      }}
    >
      <MessageSquareIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {conversation.title}
        </div>
        <div className="text-xs text-muted-foreground">
          {conversation.timestamp}
        </div>
      </div>

      {/* Action buttons - shown on hover */}
      {isHovered && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Edit conversation title
              console.log(`Editing conversation: ${conversation.id}`)
            }}
          >
            <PenToolIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Delete conversation
              console.log(`Deleting conversation: ${conversation.id}`)
            }}
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}