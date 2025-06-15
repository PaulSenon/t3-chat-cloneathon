import { Message, generateObject } from "ai";
import { registry } from "./aiProviderRegistry";
import { z } from "zod";

export async function generateChatTitle(messages: Message[]) {
  console.log(
    "🔍 Generating chat title prompt:",
    `
      Please generate a title for the following conversation:

      <conversation>
      ${messages.map((m) => `${m.content}`).join("\n")}
      </conversation>

      Conversation Title:
      `
  );
  const model = registry.languageModel("google:fast");
  const result = await generateObject({
    model,
    schema: z.object({
      title: z.string(),
    }),
    system: `
      You are a helpful assistant that generates titles for conversations.
      You are given a conversation and you need to generate a title for it.
      The title should be a single sentence.
      The title should be in the same language as the conversation.
      You may use emojis if it makes sense. If any, should be the first word.
      You generate ONLY the title in plain text. Nothing else.
      No subject, no description, no explanation, no justifications, no judgements, no nothing. Just a super short title.

      Title size should be around 3-8 words.
      The first words are the most important and should be the most relevant.

      <examples>
      Don't:
      - "Je raconte une histoire amusante avec des enfants dans un parc ensoleillé."
      Do:
      - "Histoire ensoleillée au parc"

      Don't:
      - "The User is asking for best places to visit in UK"
      Do:
      - "UK: Best places to visit"
      </examples>

    `,
    prompt: `
      Please generate a title for the following conversation:

      <conversation>
      ${messages.map((m) => `${m.content}`).join("\n")}
      </conversation>

      Conversation Title:
      `,
  });
  const title = result.object.title;
  return title;
}
