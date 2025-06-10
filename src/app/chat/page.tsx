"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { BotIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Main chat page component
 *
 * This page implements a ChatGPT-like interface with:
 * - Authentication-protected chat access
 * - Collapsible sidebar for conversation history
 * - Main chat area with message history and input
 * - Responsive design that works on desktop and mobile
 *
 * Architecture decisions:
 * - Uses client-side rendering for better interactivity
 * - Implements authentication checks with Clerk
 * - Implements a two-panel layout (sidebar + main)
 * - Sidebar collapses on mobile for better UX
 */
export default function ChatPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [currentThreadId, setCurrentThreadId] =
    React.useState<Id<"threads"> | null>(null);

  const createThread = useMutation(api.threads.createThread);

  // Create a new thread when the component mounts and user is signed in
  React.useEffect(() => {
    if (isSignedIn && !currentThreadId) {
      createThread({ title: "New Chat" })
        .then((thread) => {
          if (thread) {
            setCurrentThreadId(thread._id);
          }
        })
        .catch((error) => {
          console.error("Failed to create thread:", error);
        });
    }
  }, [isSignedIn, currentThreadId, createThread]);

  // Show loading state while authentication is being checked
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <BotIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center p-8">
          <BotIcon className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Welcome to T3 Chat</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to start chatting with AI assistants and access your
            conversation history.
          </p>
          <div className="text-sm text-muted-foreground">
            Look for the sign-in button in the top-right corner ↗️
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while thread is being created
  if (!currentThreadId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <BotIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Setting up your chat...</p>
        </div>
      </div>
    );
  }

  // Show the full chat interface for authenticated users
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
          threadId={currentThreadId}
        />
      </div>
    </div>
  );
}
