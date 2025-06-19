"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { focusInput } from "@/components/chat/tmp-chat-input";
import { api } from "../../convex/_generated/api";
import {
  useColdCachedPaginatedQuery,
  useColdCachedQuery,
} from "@/hooks/useColdCachedQuery";
import { useAuth } from "@/hooks/useAuth";
import { Doc } from "../../convex/_generated/dataModel";
import {
  defaultModelId,
  getModelById,
  Model,
  modelsConfig,
} from "@/types/aiModels";
import { ThreadForListing } from "../../convex/chat";
import { UsePaginatedQueryReturnType } from "convex/react";

interface ChatListState {
  paginatedThreads: ThreadForListing[];
  isStale: boolean;
  isLoading: boolean;
  status: UsePaginatedQueryReturnType<
    typeof api.chat.getUserThreadsForListing
  >["status"];
}

interface ChatListContextValue {
  state: ChatListState;
  actions: {
    mutateOptimistic: (optimisticMutation: OptimisticMutation) => void;
    loadMore: ReturnType<typeof useColdCachedPaginatedQuery>["loadMore"];
  };
}

type OptimisticMutation = {
  mutate: (items: ThreadForListing[]) => ThreadForListing[];
  match: (item: ThreadForListing) => boolean;
};

const ChatListContext = createContext<ChatListContextValue | null>(null);

export function ChatListStateProvider({ children }: { children: ReactNode }) {
  const pendingOptimisticReconciliationFilter = useRef<OptimisticMutation[]>(
    []
  );
  const [state, setState] = useState<Pick<ChatListState, "paginatedThreads">>({
    paginatedThreads: [],
  });

  const {
    isLoading,
    isStale,
    loadMore,
    results: paginatedThreads,
    status,
  } = useColdCachedPaginatedQuery(
    api.chat.getUserThreadsForListing,
    {},
    {
      initialNumItems: 30,
    }
  );

  useEffect(() => {
    setState((prev) => {
      let tmp = paginatedThreads;
      if (pendingOptimisticReconciliationFilter.current.length > 0) {
        for (
          let i = 0;
          i < pendingOptimisticReconciliationFilter.current.length;
          i++
        ) {
          const { mutate, match } =
            pendingOptimisticReconciliationFilter.current[i];
          if (paginatedThreads.some(match)) {
            pendingOptimisticReconciliationFilter.current.splice(i, 1);
          } else {
            tmp = mutate(tmp);
          }

          // if we match any, we remove the mutations from the pending list
          // after we will need to replay the optimistic mutations on top of fresh data before assigning the new paginatedThreads state
        }
      }
      return {
        ...prev,
        paginatedThreads: tmp,
      };
    });
    // setState((prev) => ({
    //   ...prev,
    //   paginatedThreads: paginatedThreads,
    // }));
  }, [paginatedThreads]);

  const actions = {
    mutateOptimistic: (mutation: OptimisticMutation) => {
      pendingOptimisticReconciliationFilter.current.push(mutation);
      setState((prev) => ({
        ...prev,
        paginatedThreads: mutation.mutate(prev.paginatedThreads),
      }));
    },
    loadMore,
  };

  const value: ChatListContextValue = {
    state: {
      paginatedThreads: state.paginatedThreads,
      isStale,
      isLoading,
      status,
    },
    actions,
  };

  return (
    <ChatListContext.Provider value={value}>
      {children}
    </ChatListContext.Provider>
  );
}

// Export the hooks that chat.tsx expects
export function useChatListState() {
  const context = useContext(ChatListContext);
  if (!context) {
    throw new Error(
      "useChatListState must be used within ChatListStateProvider"
    );
  }

  return context.state;
}

export function useChatListActions() {
  const context = useContext(ChatListContext);
  if (!context) {
    throw new Error(
      "useChatListActions must be used within ChatListStateProvider"
    );
  }

  return context.actions;
}
