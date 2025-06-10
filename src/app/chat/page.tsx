"use client"

import React from "react"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"

/**
 * Main chat page component
 * 
 * This page implements a ChatGPT-like interface with:
 * - Collapsible sidebar for conversation history
 * - Main chat area with message history and input
 * - Responsive design that works on desktop and mobile
 * 
 * Architecture decisions:
 * - Uses client-side rendering for better interactivity
 * - Implements a two-panel layout (sidebar + main)
 * - Sidebar collapses on mobile for better UX
 */
export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - contains conversation history and controls */}
      <ChatSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      {/* Main chat interface */}
      <div className="flex-1 flex flex-col">
        <ChatInterface 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
    </div>
  )
}