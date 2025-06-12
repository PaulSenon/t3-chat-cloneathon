"use client";

import Chat from "@/components/chat/chat";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();

  return <Chat threadId={id} />;
}
