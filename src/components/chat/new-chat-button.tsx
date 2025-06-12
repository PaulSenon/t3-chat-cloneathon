"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewChatButton() {
  const router = useRouter();

  const handleNewChat = () => {
    console.log("🆕 Starting new chat - navigating to /chat");

    // Navigate to new chat (no DB record created yet)
    router.push("/chat");
  };

  return (
    <Button
      onClick={handleNewChat}
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2 h-9"
    >
      <PlusIcon size={16} />
      New Chat
    </Button>
  );
}
