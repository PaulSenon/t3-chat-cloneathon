import { CustomIconId } from "@/components/icons";

// Mock model data
export type ModelCapabilities =
  | "text"
  | "reasoning"
  | "web"
  | "vision"
  | "code";
export type Model = {
  id: string;
  name: string;
  provider: string;
  icon: CustomIconId;
  isAvailable: boolean;
  description: string;
  capabilities: ModelCapabilities[];
  isPremium: boolean;
};

export const modelsConfig: Model[] = [
  {
    id: "anthropic:claude-4-sonnet",
    name: "Claude 4 Sonnet",
    provider: "anthropic",
    icon: "anthropic",
    isAvailable: true,
    description: "For medium/big code related tasks",
    capabilities: ["text", "reasoning", "web", "code"],
    isPremium: true,
  },
  {
    id: "openai:gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    icon: "openai",
    isAvailable: true,
    description: "For small tasks",
    capabilities: ["text", "web"],
    isPremium: false,
  },
  // {
  //   id: "openai:gpt-4o",
  //   name: "GPT-4o",
  //   provider: "openai",
  //   icon: "openai",
  //   isAvailable: true,
  //   description: "For medium general tasks",
  //   capabilities: ["text", "web"],
  //   isPremium: true,
  // },
  {
    id: "openai:o4-mini",
    name: "o4 Mini",
    provider: "openai",
    icon: "openai",
    isAvailable: true,
    description: "For fast general reasoning tasks",
    capabilities: ["text", "web", "reasoning"],
    isPremium: false,
  },
  {
    id: "google:gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "google",
    icon: "gemini",
    isAvailable: true,
    description: "For fast general tasks",
    capabilities: ["text", "web"],
    isPremium: false,
  },
  {
    id: "google:gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    icon: "gemini",
    isAvailable: true,
    description: "For fast medium general tasks",
    capabilities: ["text", "web"],
    isPremium: true,
  },
  {
    id: "google:gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    icon: "gemini",
    isAvailable: true,
    description: "For complex general tasks",
    capabilities: ["text", "web", "code", "reasoning"],
    isPremium: true,
  },
] as const;

export function getModelById(id: string): Model | undefined {
  return modelsConfig.find((model) => model.id === id);
}

export const defaultModelId = "google:gemini-2.0-flash-lite";
