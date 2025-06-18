import "./chat.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatStateProvider } from "@/providers/ChatStateProvider";
import { LocalCacheProvider } from "@/providers/LocalCacheProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <LocalCacheProvider>
        <SidebarProvider>
          <ChatStateProvider>
            <ChatSidebar />
            <main className="relative group/sidebar-wrapper flex-1 min-w-0 w-full">
              <SidebarTrigger className="fixed left-3 top-3 z-50 flex p-4 bg-background-transparent top-safe-offset-2" />
              {children}
            </main>
          </ChatStateProvider>
        </SidebarProvider>
      </LocalCacheProvider>
    </TooltipProvider>
  );
}
