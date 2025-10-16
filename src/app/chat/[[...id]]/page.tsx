"use client";
import { Chat } from "@/components/chat/chat";
import { useChatState } from "@/providers/ChatStateProvider";
import { ChatThreadProvider } from "@/providers/ChatThreadProvider";
import { AIDevtools } from "@ai-sdk-tools/devtools";

// export const dynamic = "force-static";
export default function ChatPage() {
  console.log("ChatPage (never on server)");
  const chatState = useChatState();
  return (
    <ChatThreadProvider
      key={chatState.currentThreadId} // force remount when currentThreadId changes
      {...chatState}
    >
      <Chat />
      <AIDevtools
        config={{
          position: "bottom",
          theme: "dark",
          maxEvents: 1000,
          enabled: true,
        }}
      />
    </ChatThreadProvider>
  );
}
