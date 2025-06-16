import {
  streamText,
  appendResponseMessages,
  appendClientMessage,
  Message,
} from "ai";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import superjson from "superjson";
import { registry } from "@/backend/aiProviderRegistry";
import { generateChatTitle } from "@/backend/chatTitleGeneration";

export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. Authentication
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token || !userId) {
    console.log("❌ Not authenticated");
    return new Response("Not authenticated", { status: 401 });
  }
  console.log("✅ User authenticated:", userId);

  // 2. Parse request - expect AI SDK format with custom body data
  // get the last message from the client:
  const body = await req.json();
  const { message, id } = body;
  console.log("🔍 Received message:", message.id);

  // load the previous messages from the server or create a new thread:
  const existingThread = await fetchQuery(
    api.chat.getChat,
    { uuid: id },
    { token }
  );

  const thread =
    existingThread ??
    (await fetchMutation(
      api.chat.createChat,
      { uuid: id, messages: superjson.stringify([message]) },
      { token }
    ));
  // const thread =
  //   // TODO create a appendNewMessages to add the user one asap
  //   (await fetchQuery(api.chat.getChat, { uuid: id }, { token })) ??
  //   (await fetchMutation(
  //     api.chat.createChat,
  //     {
  //       uuid: id,
  //       messages: superjson.stringify([message]),
  //     },
  //     { token }
  //   ));

  if (!thread) {
    throw new Error("Failed to create or get thread");
  }

  const pastMessages: Message[] = thread.messages
    ? superjson.parse(thread.messages)
    : [];

  // append the new message to the previous messages:
  const messages = appendClientMessage({
    messages: pastMessages,
    message,
  });

  if (!existingThread || !existingThread.title) {
    generateChatTitle(messages).then((title) => {
      console.log("🔍 Generated title:", title);
      fetchMutation(api.chat.setChatTitle, { uuid: id, title }, { token });
    });
  }

  const result = streamText({
    model: registry.languageModel("openai:fast"),
    messages,
    async onFinish({ response }) {
      // console.log("🔍 Response:", JSON.stringify(response, null, 2));
      const newMessages = appendResponseMessages({
        messages,
        responseMessages: response.messages,
      });

      await fetchMutation(
        api.chat.saveChat,
        {
          uuid: thread.uuid,
          messages: superjson.stringify(newMessages),
          liveState: "completed",
        },
        { token }
      );
    },
    onError({ error }) {
      console.error("🔴 Error:", error);
      fetchMutation(
        api.chat.updateChatLiveState,
        {
          id: thread._id,
          liveState: "error",
        },
        { token }
      );
    },
  });

  // consume the stream to ensure it runs to completion & triggers onFinish
  // even when the client response is aborted:
  result.consumeStream(); // no await
  await fetchMutation(
    api.chat.updateChatLiveState,
    {
      id: thread._id,
      liveState: "streaming",
    },
    { token }
  );

  // 6. Return streaming response with thread ID in headers
  return result.toDataStreamResponse({
    headers: {
      "X-Thread-Id": thread._id,
    },
  });
}
