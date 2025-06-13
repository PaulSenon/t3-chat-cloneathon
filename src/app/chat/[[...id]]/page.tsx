import { preloadQuery } from "convex/nextjs";
import Chat from "../../../components/chat/chat";
import { api } from "../../../../convex/_generated/api";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string | undefined }>;
}) {
  // const { id } = await params;
  // const threadPromise = id ? preloadQuery(api.chat.getChat, {
  //   uuid: id,
  // }) : null;
  return <Chat threadPromise={null} />;
}
