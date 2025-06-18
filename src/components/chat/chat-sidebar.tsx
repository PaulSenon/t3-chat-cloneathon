"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserProfileButton } from "../auth/user-avatar";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Pin, X, Plus } from "lucide-react";
import { useChatActions, useChatState } from "@/providers/ChatStateProvider";
import { useColdCachedPaginatedQuery } from "@/hooks/useColdCachedQuery";
import {
  optimisticallyUpdateValueInPaginatedQuery,
  useMutation,
} from "convex/react";
import { Doc } from "../../../convex/_generated/dataModel";

type ThreadItem = Omit<Doc<"threads">, "messages" | "metadata">;

// Simple intersection observer hook - triggers callback once when sentinel is seen
function useIntersectionTrigger(
  onTrigger: () => void,
  enabled: boolean = true
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onTrigger();
        }
      },
      {
        rootMargin: "200px", // Trigger 100px before the sentinel is visible
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onTrigger, enabled]);

  return sentinelRef;
}

export function ChatSidebar() {
  const { currentThreadId } = useChatState();
  const actions = useChatActions();

  // Get real threads from Convex (RLS automatically filters to current user)
  const { isLoading, isStale, loadMore, results, status } =
    useColdCachedPaginatedQuery(
      api.chat.getUserThreadsForListing,
      {},
      {
        initialNumItems: 50,
      }
    );
  const isExhausted = status === "Exhausted";

  // Add intersection trigger for infinite scroll
  const sentinelRef = useIntersectionTrigger(
    () => {
      console.log("LOAD MORE");
      loadMore(20);
    },
    !isExhausted && !isLoading // Only enabled when we can load more and not currently loading
  );

  const handleThreadClick = (uuid: string) => {
    actions.openChat(uuid);
  };

  const handleNewChat = () => {
    actions.openNewChat();
  };

  console.log("SIDEBAR", {
    isLoading,
    isExhausted,
    status,
    results,
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-0 space-y-3">
        <div className="flex items-center justify-center">
          <h1 className="text-lg font-semibold tracking-tight">T3 Chat</h1>
        </div>

        <Button onClick={handleNewChat} className="w-full" size="sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
        <Separator />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium p-1 flex items-center gap-2">
            Previous Threads
          </SidebarGroupLabel>

          <div className="space-y-1 mt-2">
            {isLoading ? (
              // Initial loading skeleton
              Array.from({ length: 20 }).map((_, i) => (
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
              <>
                {/* Thread list */}
                {results
                  .filter((thread) => thread.status === "active")
                  .map((thread) => (
                    <ThreadItemMemo
                      key={thread._id}
                      thread={thread}
                      isActive={currentThreadId === thread.uuid}
                      isStale={isStale}
                      onClick={() => handleThreadClick(thread.uuid)}
                      liveState={thread.liveState}
                    />
                  ))}

                {/* Sentinel element for infinite scroll */}
                {!isExhausted && (
                  <div
                    ref={sentinelRef}
                    className="h-1 w-full"
                    aria-hidden="true"
                  />
                )}
              </>
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

function LiveStateIndicator({
  liveState,
}: {
  liveState: Doc<"threads">["liveState"];
}) {
  const isVisible =
    liveState === "pending" ||
    liveState === "streaming" ||
    liveState === "error";

  // Wrapper for smooth transition
  return (
    <div
      className={cn(
        "flex items-center justify-center transition-all duration-300 ease-in-out",
        isVisible ? "w-3" : "w-0"
      )}
    >
      {liveState === "pending" || liveState === "streaming" ? (
        <div title="Processing...">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
        </div>
      ) : liveState === "error" ? (
        <div title="Error">
          <span className="relative flex h-2 w-2 bg-red-500 rounded-full"></span>
        </div>
      ) : null}
    </div>
  );
}

function ThreadItem({
  thread,
  isActive,
  isStale,
  onClick,
  liveState,
}: {
  thread: ThreadItem;
  isActive: boolean;
  isStale: boolean;
  onClick: () => void;
  liveState: Doc<"threads">["liveState"];
}) {
  const actions = useChatActions();
  const deleteThread = useMutation(
    api.chat.deleteThreadById
  ).withOptimisticUpdate((localStore, mutationArgs) => {
    optimisticallyUpdateValueInPaginatedQuery(
      localStore,
      api.chat.getUserThreadsForListing,
      {},
      (currentValue) => {
        if (mutationArgs.threadId === currentValue._id) {
          return {
            ...currentValue,
            status: "deleted" as const,
          };
        }
        return currentValue;
      }
    );
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.deleteChat(thread.uuid);
    deleteThread({ threadId: thread._id });
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Pin thread:", thread.uuid);
  };

  return (
    <div
      className={cn(
        "group/link relative flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-discrete opacity-100 overflow-hidden duration-250",
        "hover:bg-accent",
        isActive && "bg-accent",
        isStale && "opacity-50"
      )}
      onClick={onClick}
    >
      <div className="relative flex w-full items-center gap-2">
        <LiveStateIndicator liveState={liveState} />
        <div className="flex-1 min-w-0 pr-2">
          {thread.title ? (
            <div className="text-sm truncate">{thread.title}</div>
          ) : (
            <Skeleton className="bg-sidebar-border w-3/4 h-5" />
          )}
        </div>

        {/* Context Actions - Hidden by default, shown on hover */}
        {!isStale && (
          <div className="pointer-events-auto absolute -right-1 bottom-0 top-0 z-50 flex translate-x-full items-center justify-end text-muted-foreground transition-transform group-hover/link:translate-x-0 group-hover/link:bg-accent">
            {/* Gradient overlay for smooth visual transition */}
            <div className="pointer-events-none absolute bottom-0 right-[100%] top-0 h-full w-8 bg-gradient-to-l from-accent to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity" />

            {/* Pin button */}
            {/* <button
              className="rounded-md p-1.5 cursor-pointer hover:bg-sidebar hover:text-secondary-foreground transition-colors"
              tabIndex={-1}
              onClick={handlePin}
              aria-label="Pin thread"
              type="button"
              disabled={isStale}
            >
              <Pin className="size-4" />
            </button> */}

            {/* Delete button */}
            <button
              className="rounded-md p-1.5 cursor-pointer hover:bg-destructive/80 hover:text-secondary-foreground transition-colors"
              tabIndex={-1}
              onClick={handleDelete}
              aria-label="Delete thread"
              type="button"
              disabled={isStale}
            >
              <X className="size-4" />
            </button>
          </div>
        )}
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
