"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useParams } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { focusInput } from "@/components/chat/tmp-chat-input";

interface ChatState {
  currentThreadId: string | undefined;
  isNewThread: boolean;
}

interface ChatContextValue {
  state: ChatState;
  actions: {
    handleInputChange: () => void;
    handleSubmit: () => void;
    openChat: (threadId: string) => void;
    openNewChat: () => void;
    clear: () => void;
    deleteChat: (threadId: string) => void;
  };
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatStateProvider({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const threadIdFromUrl = id?.[0];

  const [state, setState] = useState<ChatState>({
    currentThreadId: threadIdFromUrl,
    isNewThread: threadIdFromUrl === undefined,
  });

  const { setOpenMobile } = useSidebar();

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
    handleInputChange: () => {
      // TODO: Input caching placeholder - just log for now
      console.log("💬 Input changed for chat:", state.currentThreadId);
    },

    handleSubmit: () => {
      console.log("🚀 Submit for chat:", state.currentThreadId);

      // If on /chat (no thread ID), redirect to /chat/chatId and set currentThreadId
      if (state.isNewThread) {
        setState((prev) => ({
          ...prev,
          isNewThread: false,
        }));
        window.history.pushState(null, "", `/chat/${state.currentThreadId}`);
      }

      // If on /chat/id, do nothing (already have thread ID)
    },

    openChat: (threadId: string) => {
      setState((prev) => ({
        ...prev,
        currentThreadId: threadId,
        isNewThread: false,
      }));
      window.history.pushState(null, "", `/chat/${threadId}`);
      setOpenMobile(false);
      focusInput(); // TODO: focus input
    },

    openNewChat: () => {
      setState((prev) => ({
        ...prev,
        currentThreadId: crypto.randomUUID(),
        isNewThread: true,
      }));
      window.history.pushState(null, "", "/chat");
      setOpenMobile(false);
      focusInput(); // TODO: focus input
    },

    clear: () => {
      setState((prev) => ({
        ...prev,
        currentThreadId: crypto.randomUUID(),
        isNewThread: true,
      }));
    },

    deleteChat: (threadId: string) => {
      if (state.currentThreadId !== threadId) return;
      setState((prev) => ({
        ...prev,
        currentThreadId: crypto.randomUUID(),
        isNewThread: true,
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
    isNewThread: context.state.isNewThread,
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
