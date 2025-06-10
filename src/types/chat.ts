/**
 * Shared types for the chat interface
 * 
 * These types will be used across all chat-related components
 * and can be easily extended when integrating with Convex
 */

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  timestamp: string
  isActive?: boolean
  messages?: Message[]
}

export interface ChatState {
  currentConversation?: Conversation
  conversations: Conversation[]
  isLoading: boolean
  error?: string
}

export type MessageRole = "user" | "assistant"

export interface ChatMessage extends Message {
  // Additional properties for chat messages
  metadata?: {
    model?: string
    tokens?: number
    cost?: number
  }
}