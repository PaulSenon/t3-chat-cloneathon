import "./chat.css";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatStateProvider } from "@/providers/ChatStateProvider";
import { LocalCacheProvider } from "@/providers/LocalCacheProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatListStateProvider } from "@/providers/ChatListStateProvider";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ChatSidebar />
      <main className="relative group/sidebar-wrapper flex-1 min-w-0 w-full">
        <SidebarTrigger className="fixed left-3 top-3 z-50 flex p-4 bg-background-transparent top-safe-offset-2" />
        {children}
      </main>
    </>
  );
}
