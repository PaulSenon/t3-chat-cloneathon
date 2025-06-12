import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatCacheProvider } from "@/providers/ChatCacheProvider";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatCacheProvider>
      <SidebarProvider>
        <ChatSidebar />
        <main className="relative w-full">
          <SidebarTrigger className="fixed left-3 top-3 z-50 flex p-1 top-safe-offset-2" />
          {children}
        </main>
      </SidebarProvider>
    </ChatCacheProvider>
  );
}
