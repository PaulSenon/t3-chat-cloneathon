import {
  streamText,
  appendResponseMessages,
  appendClientMessage,
  Message,
  UIMessage,
} from "ai";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import superjson from "superjson";
import { registry } from "@/backend/aiProviderRegistry";
import { generateChatTitle } from "@/backend/chatTitleGeneration";
import z from "zod";
import { modelsConfig } from "@/types/aiModels";

export const maxDuration = 30;

const bodySchema = z.object({
  message: z
    .any()
    .optional()
    .transform((val) => val as UIMessage | undefined), // TODO: validate the message
  id: z.string(),
  selectedModelId: z.string(),
});

export type ChatBody = z.infer<typeof bodySchema>;

// Helper function to create optimistic step-start message
const createOptimisticStepStartMessage = (): UIMessage => ({
  id: Date.now().toString(),
  role: "assistant",
  parts: [
    {
      type: "step-start",
    },
  ],
  createdAt: new Date(),
  content: "",
});

export async function POST(req: Request) {
  // 1. Authentication
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token || !userId) {
    console.log("❌ Not authenticated");
    return new Response("Not authenticated", { status: 401 });
  }
  console.log("✅ User authenticated:", userId);
  const user = await fetchQuery(api.users.getCurrentUser, undefined, { token });
  if (!user) {
    return new Response("Not authenticated", { status: 401 });
  }

  // 2. Parse request - expect AI SDK format with custom body data
  // get the last message from the client:
  const body = await req.json();
  const { message, id, selectedModelId } = bodySchema.parse(body);

  if (!message) {
    return new Response("No message provided", { status: 400 });
  }

  const model = modelsConfig.find((model) => model.id === selectedModelId);
  if (!model) {
    return new Response("Model not found", { status: 404 });
  }

  if (user.tier !== "premium-level-1" && model.isPremium) {
    return new Response("User on free tier cannot use premium model", {
      status: 403,
    });
  }

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
    return new Response("Failed to create or get thread", { status: 500 });
  }

  const deferredPromiseChain =
    // deferredPromises.push(
    fetchMutation(
      api.chat.setChatLastUsedModel,
      {
        id: thread._id,
        lastUsedModelId: selectedModelId,
      },
      { token }
    );
  // );

  const pastMessages: Message[] = thread.messages
    ? superjson.parse(thread.messages)
    : [];

  // append the new message to the previous messages:
  const messages = appendClientMessage({
    messages: pastMessages,
    message,
  }).filter((m) => m.content.length > 0);

  // Add optimistic step-start message immediately for UI feedback
  const messagesWithStepStart = [
    ...messages,
    createOptimisticStepStartMessage(),
  ];

  // TODO: non blocking save
  // Save the optimistic step-start message to the database immediately
  deferredPromiseChain.finally(() =>
    fetchMutation(
      api.chat.saveChat,
      {
        uuid: thread.uuid,
        messages: superjson.stringify(messagesWithStepStart),
        liveState: "streaming",
      },
      { token }
    )
  );

  if (!existingThread || !existingThread.title) {
    deferredPromiseChain.finally(() =>
      generateChatTitle(messages).then((title) => {
        console.log("🔍 Generated title:", title);
        fetchMutation(api.chat.setChatTitle, { uuid: id, title }, { token });
      })
    );
  }

  const result = streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: registry.languageModel(model.id as any), // TODO: fix when fully typed
    messages,
    async onFinish({ response }) {
      // console.log("🔍 Response:", JSON.stringify(response, null, 2));
      const newMessages = appendResponseMessages({
        messages, // Use original messages without step-start for final save
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

  // await Promise.all(deferredPromises).catch((error) => {
  //   console.error("🔴 Error in deferred promises:", error);
  // });
  await deferredPromiseChain.catch((error) => {
    console.error("🔴 Error in deferred promises:", error);
  });

  // 6. Return streaming response with thread ID in headers
  return result.toDataStreamResponse({
    headers: {
      "X-Thread-Id": thread._id,
    },
    sendReasoning: true,
    sendSources: true,
    sendUsage: true,
  });
}
