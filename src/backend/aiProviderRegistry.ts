import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createProviderRegistry, customProvider } from "ai";
import { LanguageModelV1, ProviderV1 } from "@ai-sdk/provider";
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

// type P = {
//   (modelId: string, settings?: Record<string, unknown>): LanguageModelV1;
// };
// type ProviderConfig = Record<string, P>;
// function createProviderConfig<T extends ProviderConfig>(config: T): T {
//   return config;
// }

// const providers = createProviderConfig({
//   anthropic,
//   openai,
//   google,
// });

// type ProviderName<C extends ProviderConfig> = keyof C;
// type Test5 = ProviderName<typeof providers>;
// type Provider<C extends ProviderConfig, N extends ProviderName<C>> = C[N];
// type Test6 = Provider<typeof providers, "google">;
// type Test62 = Parameters<Provider<typeof providers, "anthropic">>;
// type ProviderModel<C extends ProviderConfig, N extends ProviderName<C>> =
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   Provider<C, N> extends (arg0: ProviderName<C>, ...rest: any) => any
//     ? Parameters<Provider<C, N>>[0]
//     : never;
// type Test7 = ProviderModel<typeof providers, "anthropic">;
// type ProviderModelSettings<
//   C extends ProviderConfig,
//   N extends ProviderName<C>,
// > =
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   Provider<C, N> extends (...args: any) => any
//     ? Exclude<Parameters<Provider<C, N>>[1], undefined>
//     : never;
// type Test8 = ProviderModelSettings<typeof providers, "google">;

// // test
// type Test = ProviderModel<typeof providers, "anthropic">;
// type Test2 = ProviderModelSettings<typeof providers, "google">;

// type ModelCapability = "text" | "vision" | "web" | "reasoning";
// type ModelPricing = {
//   dollarPricePerMillionInputTokens: number;
//   dollarPricePerMillionOutputTokens: number;
// };
// type ModelConfig<C extends ProviderConfig, N extends ProviderName<C>> = {
//   modelId: ProviderModel<C, N>;
//   providerId: N;
//   displayName: string;
//   capabilities: ModelCapability[];
//   pricing: ModelPricing;
//   isPremium: boolean;
//   contextWindow: number;
//   settings: ProviderModelSettings<C, N>;
//   description: string;
//   isAvailable: boolean;
// };
// type Test3 = ModelConfig<typeof providers, "anthropic">;
// type ModelConfigInput<
//   C extends ProviderConfig,
//   N extends ProviderName<C>,
// > = Omit<ModelConfig<C, N>, "modelId" | "providerId">;
// type Test9 = ModelConfigInput<typeof providers, "anthropic">;

// type AiGlobalConfigProviderValue<
//   C extends ProviderConfig,
//   N extends ProviderName<C>,
// > = {
//   [K in ProviderModel<C, N>]?: ModelConfig<C, N>;
// };
// type Test10 = AiGlobalConfigProviderValue<typeof providers, "anthropic">;
// type AiGlobalConfigProviderInput<
//   C extends ProviderConfig,
//   N extends ProviderName<C>,
// > = {
//   [K in ProviderModel<C, N>]?: ModelConfigInput<C, N>;
// };
// type Test11 = AiGlobalConfigProviderInput<typeof providers, "anthropic">;

// type AiGlobalConfig<C extends ProviderConfig> = {
//   [N in ProviderName<C>]: AiGlobalConfigProviderValue<C, N>;
// };

// type AiGlobalConfigInput<C extends ProviderConfig> = {
//   [N in ProviderName<C>]: AiGlobalConfigProviderInput<C, N>;
// };
// type Test12 = AiGlobalConfigProviderInput<typeof providers, "anthropic">;

// type Test13 = AiGlobalConfigProviderInput<typeof providers, "openai">;
// const toto: Test13 = {
//   fjfj: {
//     displayName: "fjfj",
//     capabilities: ["text"],
//     pricing: {
//       dollarPricePerMillionInputTokens: 0,
//       dollarPricePerMillionOutputTokens: 0,
//     },
//     isPremium: false,
//     contextWindow: 100000,
//     settings: {},
//     description: "fjfj",
//     isAvailable: true,
//   },
// };
// const MyConfig = createAiGlobalConfig({
//   anthropic: {
//     "claude-3-5-haiku-latest": {},
//   },
// });

// function createAiGlobalConfig<
//   P extends ProviderConfig,
//   CIn extends AiGlobalConfigInput<P>,
//   COut extends AiGlobalConfig<P>,
// >(supportedProviders: P, config: CIn): COut {
//   // add
//   return Object.entries(config).map(([providerName, modelConfig]) => {
//     const provider = supportedProviders[providerName];
//     return {
//       ...modelConfig,
//       providerId: providerName,
//       modelId: provider.languageModel(modelConfig.modelId),
//     };
//   });
// }

// const globalConfig = createAiGlobalConfig({
//   anthropic: [
//     {
//       modelId: "claude-3-5-haiku-latest",
//       providerId: "anthropic",
//       displayName: "Claude 3.5 Haiku",
//       capabilities: ["text", "reasoning"],
//       contextWindow: 100000,
//       description: "Claude 3.5 Haiku",
//       isAvailable: true,
//       isPremium: false,
//       pricing: {
//         dollarPricePerMillionInputTokens: 0.0000015,
//         dollarPricePerMillionOutputTokens: 0.000006,
//       },
//       settings: {},
//     },
//   ],
//   openai: [
//     {
//       modelId: "gpt-4o-mini",
//       providerId: "openai",
//       displayName: "GPT-4o Mini",
//       capabilities: ["text"],
//       contextWindow: 100000,
//       description: "GPT-4o Mini",
//       isAvailable: true,
//       isPremium: false,
//       pricing: {
//         dollarPricePerMillionInputTokens: 0.0000015,
//         dollarPricePerMillionOutputTokens: 0.000006,
//       },
//       settings: {},
//     },
//   ],
//   google: [
//     {
//       modelId: "gemini-2.0-flash-lite",
//       providerId: "google",
//       displayName: "Gemini 2.0 Flash Lite",
//       capabilities: ["text"],
//       contextWindow: 100000,
//       description: "Gemini 2.0 Flash Lite",
//       isAvailable: true,
//       isPremium: false,
//       pricing: {
//         dollarPricePerMillionInputTokens: 0.0000015,
//         dollarPricePerMillionOutputTokens: 0.000006,
//       },
//       settings: {},
//     },
//   ],
// });

export const registry = createProviderRegistry({
  // register provider with prefix and default setup:
  anthropic: customProvider({
    languageModels: {
      "claude-4-sonnet": anthropic("claude-4-sonnet-20250514"),
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
      // "claude-4-opus": anthropic("claude-4-opus-20250514"),
    },
  }),

  // register provider with prefix and custom setup:
  openai: customProvider({
    languageModels: {
      "gpt-4o-mini": openai("gpt-4o-mini"),
      "gpt-4o": openai("gpt-4o"),
      "o4-mini": openai("o4-mini"),
      // reasoning_max: openai("o3-mini"),
    },
  }),

  google: customProvider({
    languageModels: {
      "gemini-2.0-flash-lite": google("gemini-2.0-flash-lite"),
      "gemini-2.0-flash": google("gemini-2.0-flash"),
      "gemini-2.5-pro": google("gemini-2.5-pro-preview-05-06"),
    },
  }),
});
