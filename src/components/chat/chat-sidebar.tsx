"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Conversation } from "@/types/chat";
import { UserProfileButton } from "../auth/user-avatar";
import { Separator } from "../ui/separator";

/**
 * Mock conversation data
 * TODO: Replace with actual data from Convex
 */
const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Building a React App",
    timestamp: "2 hours ago",
    isActive: true,
  },
  { id: "2", title: "TypeScript Best Practices", timestamp: "Yesterday" },
  { id: "3", title: "Next.js 15 Features", timestamp: "3 days ago" },
  { id: "4", title: "Convex Database Setup", timestamp: "1 week ago" },
  { id: "5", title: "Tailwind CSS Tips", timestamp: "1 week ago" },
  { id: "6", title: "shadcn/ui Components", timestamp: "2 weeks ago" },
];

export function ChatSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h1 className="text-xl font-medium flex-grow text-center">T4-Chat</h1>
        <Separator />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup className="">
          <SidebarGroupLabel className="text-xs font-medium p-1">
            Conversations
          </SidebarGroupLabel>
          {mockConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <UserProfileButton className="border rounded-lg" />
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Simple conversation item component
 */
function ConversationItem({ conversation }: { conversation: Conversation }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-4 rounded-lg cursor-pointer transition-colors",
        "hover:bg-accent",
        conversation.isActive && "bg-accent"
      )}
      onClick={() => {
        console.log(`Opening conversation: ${conversation.id}`);
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-small truncate">{conversation.title}</div>
      </div>
    </div>
  );
}
