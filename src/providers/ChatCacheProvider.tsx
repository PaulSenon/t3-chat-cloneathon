"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
interface ChatCacheContextType {
  // Current thread management
  currentThreadId: string | undefined;
  setCurrentThreadId: (id: string) => void;
  createNewThread: () => void;
}

const ChatCacheContext = createContext<ChatCacheContextType | null>(null);

export function ChatCacheProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const threadId = params.id?.[0];
  const [currentThreadId, _setCurrentThreadId] = useState<string | null>(
    threadId ?? null
  );
  const [optimisticThreadId, _setOptimisticThreadId] = useState<string | null>(
    null
  );

  // Generate UUID only on client, only if null
  useEffect(() => {
    if (optimisticThreadId === null && currentThreadId === null) {
      _setOptimisticThreadId(crypto.randomUUID());
    }
  }, [optimisticThreadId, currentThreadId]);

  useEffect(() => {
    console.log("currentThreadId changed", currentThreadId);
  }, [currentThreadId]);

  const setCurrentThreadId = (id: string) => {
    _setCurrentThreadId(id);
    _setOptimisticThreadId(id);
    window.history.pushState(null, "", `/chat/${id}`);
  };

  const createNewThread = () => {
    _setCurrentThreadId(null);
    _setOptimisticThreadId(crypto.randomUUID());
    window.history.pushState(null, "", "/chat");
  };

  return (
    <ChatCacheContext.Provider
      value={{
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
