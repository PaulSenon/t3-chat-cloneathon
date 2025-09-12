import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useChatActions } from "./ChatStateProvider";
import { useChat, UseChatHelpers } from "@ai-sdk/react";
import { parseMessages } from "@/lib/parser";
import { useColdCachedQuery } from "@/hooks/useColdCachedQuery";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Doc, Id } from "../../convex/_generated/dataModel";
import {
  insertAtTop,
  useMutation,
  optimisticallyUpdateValueInPaginatedQuery,
} from "convex/react";
import superjson from "superjson";
import { defaultModelId, Model } from "@/types/aiModels";
import { ChatBody } from "@/app/api/chat/route";
interface ChatThreadActions {
  handleInputChange: UseChatHelpers["handleInputChange"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  reload: UseChatHelpers["reload"];
}

interface ChatThreadState {
  isLoading: boolean;
  isStale: boolean;
  status: UseChatHelpers["status"];
  messages: UseChatHelpers["messages"];
  input: UseChatHelpers["input"];
}

interface ChatThreadContextValue {
  state: ChatThreadState;
  actions: ChatThreadActions;
}

const ChatThreadContext = createContext<ChatThreadContextValue | null>(null);

export function ChatThreadProvider({
  children,
  currentThreadId,
  isNewThread,
  currentThread,
  isStale,
  isLoading,
  selectedModel,
}: {
  children: ReactNode;
  currentThreadId: string | undefined;
  isNewThread: boolean;
  currentThread: Doc<"threads"> | null | undefined;
  isStale: boolean;
  isLoading: boolean;
  selectedModel?: Model;
}) {
  // const { isAnonymous } = useAuth();
  const actions = useChatActions();

  // // fetch the current thread (only if we have an id (not on /chat))
  // const { data: currentThread, isStale } = useColdCachedQuery(
  //   // const isStale = false;
  //   // const currentThread = useQuery(
  //   // const isStale = false;
  //   // const currentThread = useHotCachedQuery(
  //   api.chat.getChat,
  //   currentThreadId && !isNewThread
  //     ? {
  //         uuid: currentThreadId,
  //       }
  //     : "skip"
  // ); // undefined = loading, null = no thread

  // const isLoading =
  //   !isAnonymous && !!currentThreadId && currentThread === undefined;

  // we need to parse the messages if we received a thread
  const initialMessages = useMemo(() => {
    try {
      if (!currentThread) return undefined;
      if (!currentThread.messages) return undefined;
      return parseMessages(currentThread.messages);
    } catch (e) {
      console.error("error parsing messages !!!", e);
      return undefined;
    }
  }, [currentThread]);

  const {
    input,
    handleInputChange: chatHandleInputChange,
    handleSubmit: chatHandleSubmit,
    status,
    messages,
    setMessages: setChatMessages,
    reload: chatReload,
  } = useChat({
    api: "/api/chat",
    id: currentThreadId, // use the provided chat ID
    initialMessages, // initial messages if provided
    sendExtraMessageFields: true, // send id and createdAt for each message
    experimental_throttle: 50,
    // only send the last message to the server:
    // experimental_prepareRequestBody({ messages, id }) {
    //   return { message: messages[messages.length - 1], id };
    // },
    experimental_prepareRequestBody: ({ messages, id }) =>
      ({
        id,
        message: messages.at(-1),
        selectedModelId: selectedModel?.id ?? defaultModelId,
      }) satisfies ChatBody,

    onFinish: (message) => {
      console.log("🔍 Finished message:", message);
    },

    onError: (error) => {
      console.error("🔍 useChat error:", {
        error,
        status,
        messages,
        input,
        selectedModel,
      });

      // TODO: UI feedback
      // TODO: restore input value
    },

    onResponse: async (response) => {
      // Handle new thread creation
      const threadId = response.headers.get("X-Thread-Id");
      console.log("real threadId from server", threadId);
    },
  });

  useEffect(() => {
    console.log("currentThread", currentThread);
  }, [currentThread]);

  // TODO: find fix. Cool but, when we are submitting a new chat, right after submit, isNewThread is false, but currentThread is undefined.
  // => fixed by adding status !== "submitted" but might be a bit hacky.
  useEffect(() => {
    if (
      !isNewThread &&
      !isLoading &&
      !currentThread &&
      status !== "submitted"
    ) {
      console.warn("THREAD NOT FOUND", currentThreadId);
      actions.openNewChat();
    }
  }, [isNewThread, isLoading, currentThread, currentThreadId, status, actions]);

  const handleInputChange: UseChatHelpers["handleInputChange"] = (e) => {
    actions.handleInputChange();
    chatHandleInputChange(e); // update the chat
  };

  const createThreadOptimistic = useMutation(
    api.chat.createChat
  ).withOptimisticUpdate((localStore, mutationArgs) => {
    insertAtTop({
      paginatedQuery: api.chat.getUserThreadsForListing,
      argsToMatch: {}, // same args as in the sidebar
      localQueryStore: localStore,
      item: {
        _id: crypto.randomUUID() as Id<"threads">,
        uuid: mutationArgs.uuid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
        liveState: "pending",
        title: undefined,
        userId: crypto.randomUUID() as Id<"users">,
        lastUsedModelId: selectedModel?.id ?? defaultModelId,
        _creationTime: Date.now(),
      },
    });
  });
  const updateThreadOptimistic = useMutation(
    api.chat.patchChat
  ).withOptimisticUpdate((localStore, mutationArgs) => {
    optimisticallyUpdateValueInPaginatedQuery(
      localStore,
      api.chat.getUserThreadsForListing,
      {},
      (currentValue) => {
        if (mutationArgs.id === currentValue._id) {
          return {
            ...currentValue,
            liveState: mutationArgs.liveState ?? currentValue.liveState,
            lastUsedModelId:
              mutationArgs.lastUsedModelId ?? currentValue.lastUsedModelId,
          };
        }
        return currentValue;
      }
    );
  });
  // const standaloneOptimisticUpdate = useStandaloneOptimisticUpdate();
  // const updateLocalThreadOptimistic = standaloneOptimisticUpdate(
  //   api.chat.patchChat,
  //   (localStore, mutationArgs) => {
  //     optimisticallyUpdateValueInPaginatedQuery(
  //       localStore,
  //       api.chat.getUserThreadsForListing,
  //       {},
  //       (currentValue) => {
  //         if (mutationArgs.id === currentValue._id) {
  //           return {
  //             ...currentValue,
  //             liveState: mutationArgs.liveState ?? currentValue.liveState,
  //             lastUsedModelId:
  //               mutationArgs.lastUsedModelId ?? currentValue.lastUsedModelId,
  //           };
  //         }
  //         return currentValue;
  //       }
  //     );
  //   }
  // );
  const handleSubmit: UseChatHelpers["handleSubmit"] = (e) => {
    e?.preventDefault?.();
    actions.handleSubmit();
    if (currentThreadId && isNewThread) {
      createThreadOptimistic({
        uuid: currentThreadId,
        messages: superjson.stringify(messages),
      });
    } else if (currentThread) {
      // TODO: find a way to not race with server... in case of error we are overriding it.
      updateThreadOptimistic({
        id: currentThread?._id,
        liveState: "pending",
        lastUsedModelId: selectedModel?.id ?? defaultModelId,
      });
    }
    chatHandleSubmit(e);
  };

  const reload: UseChatHelpers["reload"] = () => {
    // TODO: make sure not duplicated messages
    return chatReload();
  };

  const value: ChatThreadContextValue = {
    state: {
      input,
      isLoading,
      isStale,
      status,
      messages,
    },
    actions: {
      handleInputChange,
      handleSubmit,
      reload,
    },
  };
  return (
    <ChatThreadContext.Provider value={value}>
      {children}
    </ChatThreadContext.Provider>
  );
}

export function useChatThreadState() {
  const ctx = useContext(ChatThreadContext);
  if (!ctx) throw new Error("Missing ChatThreadProvider");
  return ctx.state;
}

export function useChatThreadActions() {
  const ctx = useContext(ChatThreadContext);
  if (!ctx) throw new Error("Missing ChatThreadProvider");
  return ctx.actions;
}
