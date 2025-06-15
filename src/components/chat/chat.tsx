"use client";

import { useChat } from "@ai-sdk/react";
import TmpChatInput from "./tmp-chat-input";
import { BotIcon } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { api } from "../../../convex/_generated/api";
import { useColdCachedQuery } from "@/hooks/useColdCachedQuery";
import { useEffect, useMemo } from "react";
import { parseMessages } from "@/lib/parser";
import { useChatState, useChatActions } from "@/providers/ChatStateProvider";
import { insertAtTop, useMutation } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import superjson from "superjson";
import { useAuth } from "@/hooks/useAuth";

export default function Chat() {
  const { isAnonymous } = useAuth();
  const { currentThreadId, isNewThread } = useChatState();
  const actions = useChatActions();

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
        title: undefined,
        userId: crypto.randomUUID() as Id<"users">,
        _creationTime: Date.now(),
      },
    });
  });

  // fetch the current thread (only if we have an id (not on /chat))
  const { data: currentThread, isStale } = useColdCachedQuery(
    // const isStale = false;
    // const currentThread = useQuery(
    // const isStale = false;
    // const currentThread = useHotCachedQuery(
    api.chat.getChat,
    currentThreadId
      ? {
          uuid: currentThreadId,
        }
      : "skip"
  ); // undefined = loading, null = no thread
  const isLoading =
    !isAnonymous && currentThreadId && currentThread === undefined;

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

  // we create the useChat instance but in case of no thread id it's simply not used
  const {
    input,
    handleInputChange: chatHandleInputChange,
    handleSubmit: chatHandleSubmit,
    messages,
  } = useChat({
    api: "/api/chat",
    id: currentThreadId, // use the provided chat ID
    initialMessages, // initial messages if provided
    sendExtraMessageFields: true, // send id and createdAt for each message
    // only send the last message to the server:
    experimental_prepareRequestBody({ messages, id }) {
      return { message: messages[messages.length - 1], id };
    },

    onFinish: (message) => {
      console.log("🔍 Finished message:", message);
    },

    onError: (error) => {
      console.error("🔍 useChat error:", error);
    },

    onResponse: async (response) => {
      // Handle new thread creation
      const threadId = response.headers.get("X-Thread-Id");
      console.log("real threadId from server", threadId);
    },
  });

  useEffect(() => {
    console.log("chat debug", {
      currentThreadId,
      initialMessages,
      currentThread,
      isLoading,
      isAnonymous,
      isNewThread,
    });
  }, [
    currentThreadId,
    isLoading,
    isNewThread,
    initialMessages,
    currentThread,
    isAnonymous,
  ]);

  useEffect(() => {
    if (!isNewThread && !isLoading && !currentThread) {
      console.warn("THREAD NOT FOUND", currentThreadId);
      actions.openNewChat();
    }
  }, [isNewThread, isLoading, currentThread, currentThreadId, actions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    actions.handleInputChange(); // TODO: perhaps saving the input in case of page reload to restore it. We should keep one cached input state per chat id. and perhaps one shared when we are on /chat (because id not persisted yet)
    chatHandleInputChange(e); // update the chat
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actions.handleSubmit(); // TODO: if was on /chat, we shallow redirect to /chat/chatId, and set the currentThreadId to chatId. If was on /chat/id, we will do nothing.
    if (currentThreadId && isNewThread) {
      createThreadOptimistic({
        uuid: currentThreadId,
        messages: superjson.stringify(messages),
      });
    }
    chatHandleSubmit(e);
  };

  // simplified rendering code, extend as needed:
  return (
    <div className="h-screen w-full overflow-y-scroll overscroll-contain">
      <div className="max-w-3xl mx-auto space-y-5 p-4">
        <div className="aria-hidden h-10"></div>
        <div className="text-sm text-muted-foreground">
          {currentThreadId ?? "null"} {messages.length}{" "}
          {initialMessages?.length}
        </div>

        {isNewThread ? (
          <NewChatPlaceholder />
        ) : isLoading ? (
          <LoadingChatPlaceholder />
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              isStale={isStale}
              message={{
                id: message.id,
                content: message.content,
                role: message.role as "user" | "assistant",
                timestamp: message.createdAt,
              }}
            />
          ))
        )}
        <div className="aria-hidden h-40"></div>
      </div>

      <TmpChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={currentThread === undefined}
      />
    </div>
  );
}

const NewChatPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">Start a new conversation</h2>
      <p className="text-muted-foreground">Send a message to begin chatting.</p>
    </div>
  );
};

const LoadingChatPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BotIcon className="h-12 w-12 text-muted mb-4" />
      <h2 className="text-lg font-semibold mb-2 text-muted">Loading...</h2>
    </div>
  );
};
