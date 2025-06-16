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
import { api } from "../../convex/_generated/api";
import { useColdCachedQuery } from "@/hooks/useColdCachedQuery";
import { useAuth } from "@/hooks/useAuth";
import { Doc } from "../../convex/_generated/dataModel";

interface ChatState {
  currentThreadId: string | undefined;
  isNewThread: boolean;
  currentThread: Doc<"threads"> | null | undefined;
  isStale: boolean;
  isLoading: boolean;
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
  const { isAnonymous } = useAuth();
  // const router = useRouter();
  const threadIdFromUrl = id?.[0];

  const [state, setState] = useState({
    currentThreadId: threadIdFromUrl,
    isNewThread: threadIdFromUrl === undefined,
  });

  const { setOpenMobile } = useSidebar();

  // fetch the current thread (only if we have an id (not on /chat))
  const { data: currentThread, isStale } = useColdCachedQuery(
    // const isStale = false;
    // const currentThread = useQuery(
    // const isStale = false;
    // const currentThread = useHotCachedQuery(
    api.chat.getChat,
    state.currentThreadId && !state.isNewThread
      ? {
          uuid: state.currentThreadId,
        }
      : "skip"
  ); // undefined = loading, null = no thread

  const isLoading =
    !isAnonymous && !!state.currentThreadId && currentThread === undefined;

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
        // router.replace(`/chat/${state.currentThreadId}`);
      }

      // If on /chat/id, do nothing (already have thread ID)
    },

    openChat: (threadId: string) => {
      setState((prev) => ({
        ...prev,
        currentThreadId: threadId,
        isNewThread: false,
      }));
      // router.push(`/chat/${threadId}`);
      window.history.pushState(null, "", `/chat/${threadId}`);
      setOpenMobile(false);
      focusInput(); // TODO: focus input
    },

    openNewChat: () => {
      const newId = crypto.randomUUID();
      setState((prev) => ({
        ...prev,
        currentThreadId: newId,
        isNewThread: true,
      }));
      // router.push("/chat");
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
      // router.push("/chat");
      window.history.pushState(null, "", "/chat");
    },
  };

  const value: ChatContextValue = {
    state: {
      currentThreadId: state.currentThreadId,
      isNewThread: state.isNewThread,
      currentThread,
      isStale,
      isLoading,
    },
    actions,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Export the hooks that chat.tsx expects
export function useChatState() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatState must be used within ChatStateProvider");
  }

  return context.state;
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
