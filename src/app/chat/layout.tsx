import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <main className="relative w-full">
        <SidebarTrigger className="fixed left-3 top-3 z-50 flex p-1 top-safe-offset-2" />
        {children}
      </main>
    </SidebarProvider>
  );
}
