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
import { UserProfileButton } from "../auth/user-avatar";
import { Separator } from "../ui/separator";
import { NewChatButton } from "./new-chat-button";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
interface ThreadItem {
  title?: string;
}

export function ChatSidebar() {
  const { isAuthenticated } = useAuth();
  const threads = useQuery(
    api.chat.getUserThreads,
    isAuthenticated
      ? {
          paginationOpts: {
            numItems: 50,
            cursor: null,
          },
        }
      : "skip"
  );
  const router = useRouter();
  const { id } = useParams();
  const currentThreadId: string | undefined = id as string;
  console.log("chat-sidebar currentThreadId", currentThreadId);

  const handleThreadClick = (threadId: string) => {
    console.log(`chat-sidebar 🔄 Switching to thread: ${threadId}`);
    router.push(`/chat/${threadId}`);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h1 className="text-xl font-medium flex-grow text-center">T3 Chat</h1>
        <Separator className="mt-2" />
        <div className="mt-3">
          <NewChatButton />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium p-1 flex items-center gap-2">
            Previous Threads
          </SidebarGroupLabel>

          <div className="space-y-1 mt-2">
            {threads === undefined ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <ThreadItemSkeleton key={i} index={i} />
              ))
            ) : threads.page.length === 0 ? (
              // Empty state
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs">Start a new thread</p>
              </div>
            ) : (
              // Thread list
              threads.page.map((thread) => (
                <ThreadItem
                  key={thread._id}
                  thread={thread}
                  isActive={currentThreadId === thread.uuid}
                  onClick={() => handleThreadClick(thread.uuid)}
                />
              ))
            )}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <UserProfileButton className="border rounded-lg" />
      </SidebarFooter>
    </Sidebar>
  );
}

function ThreadItem({
  thread,
  isActive,
  onClick,
}: {
  thread: ThreadItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-4 rounded-lg cursor-pointer transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-small truncate">
          {thread.title ?? "no title"}
        </div>
      </div>
    </div>
  );
}

function ThreadItemSkeleton({ index }: { index: number }) {
  const widthClasses = ["w-full", "w-3/4", "w-4/5", "w-full", "w-2/3"];
  const widthClass = widthClasses[index % widthClasses.length];
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-4 rounded-lg",
        "transition-colors",
        "hover:bg-accent"
      )}
    >
      <div className="flex-1 min-w-0">
        <Skeleton className={cn("h-5", widthClass)} />
      </div>
    </div>
  );
}
