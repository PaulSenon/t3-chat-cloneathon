"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useParams } from "next/navigation";

interface ChatState {
  currentThreadId: string | undefined;
}

interface ChatContextValue {
  state: ChatState;
  actions: {
    handleInputChange: (chatId: string | undefined) => void;
    handleSubmit: (chatId: string | undefined) => void;
    openChat: (threadId: string) => void;
    openNewChat: () => void;
  };
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatStateProvider({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const threadIdFromUrl = id?.[0];

  const [state, setState] = useState<ChatState>({
    currentThreadId: threadIdFromUrl,
  });

  // Sync with URL changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      currentThreadId: threadIdFromUrl,
    }));
  }, [threadIdFromUrl]);

  const actions = {
    handleInputChange: (chatId: string | undefined) => {
      // TODO: Input caching placeholder - just log for now
      console.log("💬 Input changed for chat:", chatId);
    },

    handleSubmit: (chatId: string | undefined) => {
      console.log(
        "🚀 Submit for chat:",
        chatId,
        "current thread:",
        state.currentThreadId
      );

      // If on /chat (no thread ID), redirect to /chat/chatId and set currentThreadId
      if (!state.currentThreadId && chatId) {
        setState((prev) => ({
          ...prev,
          currentThreadId: chatId,
        }));
        window.history.pushState(null, "", `/chat/${chatId}`);
      }

      // If on /chat/id, do nothing (already have thread ID)
    },

    openChat: (threadId: string) => {
      setState((prev) => ({
        ...prev,
        currentThreadId: threadId,
      }));
      window.history.pushState(null, "", `/chat/${threadId}`);
    },

    openNewChat: () => {
      setState((prev) => ({
        ...prev,
        currentThreadId: undefined,
      }));
      window.history.pushState(null, "", "/chat");
    },
  };

  return (
    <ChatContext.Provider value={{ state, actions }}>
      {children}
    </ChatContext.Provider>
  );
}

// Export the hooks that chat.tsx expects
export function useChatState() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatState must be used within ChatStateProvider");
  }

  return {
    currentThreadId: context.state.currentThreadId,
  };
}

export function useChatActions() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatActions must be used within ChatStateProvider");
  }

  return context.actions;
}

// Helper function
function extractThreadIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/chat\/(.+)$/);
  return match ? match[1] : undefined;
}
