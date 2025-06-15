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
    clear: () => void;
  };
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatStateProvider({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const threadIdFromUrl = id?.[0];

  const [state, setState] = useState<ChatState>({
    currentThreadId: threadIdFromUrl,
  });

  useEffect(() => {
    if (!state.currentThreadId) {
      setState((prev) => ({
        ...prev,
        currentThreadId: crypto.randomUUID(),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = {
    handleInputChange: (_chatId: string | undefined) => {
      // TODO: Input caching placeholder - just log for now
      console.log("💬 Input changed for chat:", _chatId);
    },

    handleSubmit: (chatId: string | undefined) => {
      console.log(
        "🚀 Submit for chat:",
        chatId,
        "current thread:",
        state.currentThreadId
      );

      // If on /chat (no thread ID), redirect to /chat/chatId and set currentThreadId
      if (!state.currentThreadId) {
        const chatId = crypto.randomUUID();
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
        currentThreadId: crypto.randomUUID(),
      }));
      window.history.pushState(null, "", "/chat");
    },

    clear: () => {
      setState((prev) => ({
        ...prev,
        currentThreadId: crypto.randomUUID(),
      }));
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
