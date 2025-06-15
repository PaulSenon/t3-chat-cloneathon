import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createProviderRegistry, customProvider } from "ai";
import { env } from "@/env";

const anthropic = createAnthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

export const registry = createProviderRegistry({
  // register provider with prefix and default setup:
  anthropic: customProvider({
    languageModels: {
      fast: anthropic("claude-3-5-haiku-latest"),
      default: anthropic("claude-4-sonnet-20250514"),
      // https://ai-sdk.dev/docs/ai-sdk-core/provider-management
      // reasoning: wrapLanguageModel({
      //   model: anthropic("claude-3-7-sonnet-20250219"),
      //   middleware: defaultSettingsMiddleware({
      //     settings: {
      //       maxTokens: 100000, // example default setting
      //       providerMetadata: {
      //         anthropic: {
      //           thinking: {
      //             type: "enabled",
      //             budgetTokens: 32000,
      //           },
      //         } satisfies AnthropicProviderOptions,
      //       },
      //     },
      //   }),
      // }),
      max: anthropic("claude-4-opus-20250514"),
    },
  }),

  // register provider with prefix and custom setup:
  openai: customProvider({
    languageModels: {
      fast: openai("gpt-4o-mini"),
      default: openai("gpt-4o"),
      max: openai("o4-mini"),
      // reasoning_max: openai("o3-mini"),
    },
  }),

  google: customProvider({
    languageModels: {
      fast: google("gemini-2.0-flash-lite"),
      default: google("gemini-2.0-flash"),
      max: google("gemini-2.5-pro-preview-05-06"),
    },
  }),
});
