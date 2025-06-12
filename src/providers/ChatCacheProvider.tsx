"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../convex/_generated/api";
import { Message } from "@/types/chat";
import superjson from "superjson";
import { useStableCachedQuery } from "@/hooks/useStableCachedQuery";
import { useParams } from "next/navigation";
import { useQuery } from "convex-helpers/react/cache/hooks";

type ParsedThread = Doc<"threads"> & {
  messages: Message[];
};

interface ChatCacheContextType {
  // Current thread management
  currentThread: ParsedThread | null;
  isLoadingCurrentThread: boolean;
  currentThreadId: string | undefined;
  setCurrentThreadId: (id: string) => void;
  createNewThread: () => void;
}

function parseThread(thread: Doc<"threads">): ParsedThread {
  return {
    ...thread,
    messages: superjson.parse(thread.messages),
  };
}

const ChatCacheContext = createContext<ChatCacheContextType | null>(null);

export function ChatCacheProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const threadId = params.id?.[0];
  const { isAuthenticated } = useAuth();
  const [currentThreadId, _setCurrentThreadId] = useState<string | null>(
    threadId ?? null
  );
  const [optimisticThreadId, _setOptimisticThreadId] = useState<string | null>(
    null
  );
  const [currentThread, _setCurrentThread] = useState<ParsedThread | null>(
    null
  );
  const currentThreadResult = useQuery(
    api.chat.getChat,
    isAuthenticated && currentThreadId
      ? {
          uuid: currentThreadId,
        }
      : "skip"
  );

  // thread hydration
  useEffect(() => {
    if (currentThreadResult) {
      _setCurrentThread(parseThread(currentThreadResult));
    } else {
      _setCurrentThread(null);
    }
    console.log("currentThread", currentThreadResult);
  }, [currentThreadResult]);

  // Generate UUID only on client, only if null
  useEffect(() => {
    if (optimisticThreadId === null && currentThreadId === null) {
      _setOptimisticThreadId(crypto.randomUUID());
    }
  }, [optimisticThreadId, currentThreadId]);

  const setCurrentThreadId = (id: string) => {
    _setCurrentThreadId(id);
    _setOptimisticThreadId(id);
    window.history.pushState(null, "", `/chat/${id}`);
  };

  const createNewThread = () => {
    _setCurrentThreadId(null);
    _setCurrentThread(null);
    _setOptimisticThreadId(crypto.randomUUID());
    window.history.pushState(null, "", "/chat");
  };

  return (
    <ChatCacheContext.Provider
      value={{
        currentThread: currentThread ?? null,
        isLoadingCurrentThread: currentThreadResult === undefined,
        currentThreadId: optimisticThreadId ?? currentThreadId ?? undefined,
        setCurrentThreadId,
        createNewThread,
      }}
    >
      {children}
    </ChatCacheContext.Provider>
  );
}

export const useChatCache = () => {
  const context = useContext(ChatCacheContext);
  if (!context) {
    throw new Error("useChatCache must be used within ChatCacheProvider");
  }
  return context;
};
