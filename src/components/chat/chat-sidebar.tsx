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
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import { useChatCache } from "@/providers/ChatCacheProvider";
import { useColdCachedPaginatedQuery } from "@/hooks/useColdCachedQuery";
interface ThreadItem {
  title?: string;
  uuid: string;
}

export function ChatSidebar() {
  const { setCurrentThreadId, createNewThread, currentThreadId } =
    useChatCache();

  // Get real threads from Convex (RLS automatically filters to current user)
  const { isLoading, isStale, loadMore, results, status } =
    useColdCachedPaginatedQuery(
      api.chat.getUserThreadsForListing,
      {},
      {
        initialNumItems: 50,
      }
    );

  const handleThreadClick = (uuid: string) => {
    setCurrentThreadId(uuid);
  };

  const handleNewChat = () => {
    createNewThread();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h1 className="text-xl font-medium flex-grow text-center">T3 Chat</h1>
        <Separator className="mt-2" />
        <div className="mt-3">
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            New Chat
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium p-1 flex items-center gap-2">
            Previous Threads ({status})
          </SidebarGroupLabel>

          <div className="space-y-1 mt-2">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <ThreadItemSkeleton key={i} index={i} />
              ))
            ) : results.length === 0 ? (
              // Empty state
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs">Start a new thread</p>
              </div>
            ) : (
              // Thread list
              results.map((thread) => (
                <ThreadItemMemo
                  key={thread._id}
                  thread={thread}
                  isActive={currentThreadId === thread.uuid}
                  isStale={isStale}
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

const ThreadItemMemo = React.memo(ThreadItem);

function ThreadItem({
  thread,
  isActive,
  isStale,
  onClick,
}: {
  thread: ThreadItem;
  isActive: boolean;
  isStale: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-4 rounded-lg cursor-pointer transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent",
        isStale && "opacity-50"
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-small truncate">
          {thread.title ?? thread.uuid}
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
