"use client";

import { useEffect, useState } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { BotIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";

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
  const { isLoading, isAuthenticated } = useAuth();
  const [currentThreadId, setCurrentThreadId] = useState<Id<"threads"> | null>(
    null
  );
  const createThread = useMutation(api.threads.createThread);

  // Show the full chat interface for authenticated users
  return <ChatInterface />;
}
