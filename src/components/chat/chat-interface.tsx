"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MenuIcon, SendIcon, UserIcon, BotIcon, PaperclipIcon, MicIcon } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { Message } from "@/types/chat"

interface ChatInterfaceProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

/**
 * Mock messages for demonstration
 * TODO: Replace with actual messages from Convex
 */
const mockMessages: Message[] = [
  {
    id: "1",
    content: "Hello! I'm working on a React project and need help with TypeScript types. Can you assist me?",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
  },
  {
    id: "2",
    content: "I'd be happy to help you with TypeScript types in your React project! TypeScript provides excellent type safety for React components. What specific typing challenge are you facing? Are you working with:\n\n1. Component props\n2. State management\n3. Event handlers\n4. API responses\n5. Custom hooks\n\nLet me know what you're trying to type, and I'll provide detailed examples and best practices.",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 4) // 4 minutes ago
  },
  {
    id: "3",
    content: "I'm specifically struggling with typing a custom hook that manages form state. The hook needs to handle different form field types and validation.",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 2) // 2 minutes ago
  }
]

/**
 * Main chat interface component
 * 
 * Features:
 * - Message history display
 * - Real-time message streaming (TODO)
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
export function ChatInterface({ sidebarOpen, onToggleSidebar }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  /**
   * Auto-scroll to bottom when new messages arrive
   * TODO: Add logic to prevent auto-scroll if user has scrolled up
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [mockMessages])

  /**
   * Handle sending a new message
   * TODO: Integrate with Convex and AI SDK
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    setIsLoading(true)
    
    // TODO: Add message to conversation
    console.log("Sending message:", inputValue)
    
    // TODO: Call AI API and stream response
    
    setInputValue("")
    setIsLoading(false)
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 flex-1">
          <BotIcon className="h-5 w-5 text-primary" />
          <h1 className="font-medium">AI Assistant</h1>
        </div>

        {/* TODO: Add model selector, conversation settings, etc. */}
        <div className="text-xs text-muted-foreground">
          GPT-4 Turbo
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {mockMessages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6 p-4">
              {mockMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              ))}
              {/* Invisible div for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            {/* Attachment button */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              disabled={isLoading}
            >
              <PaperclipIcon className="h-4 w-4" />
            </Button>

            {/* Message input */}
            <div className="flex-1 relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="min-h-[20px] max-h-32 resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Voice input button */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              disabled={isLoading}
            >
              <MicIcon className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="flex-shrink-0"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Input footer with tips */}
          <div className="text-xs text-muted-foreground mt-2 text-center">
            AI can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state component shown when no messages exist
 * TODO: Add example prompts, quick actions, etc.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="max-w-md">
        <BotIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">How can I help you today?</h2>
        <p className="text-muted-foreground mb-6">
          Start a conversation by typing a message below. I can help with coding, explanations, creative writing, and much more.
        </p>
        
        {/* TODO: Add example prompts */}
        <div className="grid gap-2">
          <div className="text-sm text-muted-foreground">Try asking about:</div>
          <div className="text-sm">
            • &ldquo;Help me build a React component&rdquo;<br/>
            • &ldquo;Explain TypeScript generics&rdquo;<br/>
            • &ldquo;Write a function to sort an array&rdquo;
          </div>
        </div>
      </div>
    </div>
  )
}