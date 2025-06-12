import {
  streamText,
  appendResponseMessages,
  appendClientMessage,
  Message,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import superjson from "superjson";

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
  console.log("🔍 Received body:", JSON.stringify(body, null, 2));

  // load the previous messages from the server:
  const thread =
    (await fetchQuery(api.chat.getChat, { uuid: id }, { token })) ??
    (await fetchMutation(
      api.chat.createChat,
      {
        uuid: id,
        messages: superjson.stringify([message]),
      },
      { token }
    ));

  if (!thread) {
    throw new Error("Failed to create or get thread");
  }

  // append the new message to the previous messages:
  const messages = appendClientMessage({
    messages: thread.messages ? superjson.parse(thread.messages) : [],
    message,
  });

  console.log("🔍 Messages:", JSON.stringify(messages, null, 2));
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    async onFinish({ response }) {
      console.log("🔍 Response:", JSON.stringify(response, null, 2));
      const newMessages = appendResponseMessages({
        messages,
        responseMessages: response.messages,
      });

      await fetchMutation(
        api.chat.saveChat,
        {
          uuid: thread.uuid,
          messages: superjson.stringify(newMessages),
        },
        { token }
      );
    },
  });

  // consume the stream to ensure it runs to completion & triggers onFinish
  // even when the client response is aborted:
  result.consumeStream(); // no await

  // 6. Return streaming response with thread ID in headers
  return result.toDataStreamResponse({
    headers: {
      "X-Thread-Id": thread._id,
    },
  });
}
