import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import TextareaAutosize from "react-textarea-autosize";
import {
  ArrowUpIcon,
  SquareIcon,
  ChevronDownIcon,
  GlobeIcon,
  PaperclipIcon,
  BrainIcon,
  EyeIcon,
  FileTextIcon,
} from "lucide-react";
import { useChatState } from "@/providers/ChatStateProvider";
import { cn } from "@/lib/utils";

export interface TmpChatInputProps {
  input?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isStreaming?: boolean;
  showScrollToBottom: boolean;
  onScrollToBottomClick: () => void;
}

// Mock model data
const models = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    icon: "🤖",
    capabilities: ["text", "vision", "reasoning"],
    available: true,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    icon: "⚡",
    capabilities: ["text", "vision", "web", "reasoning"],
    available: true,
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    icon: "🎭",
    capabilities: ["text", "vision", "reasoning"],
    available: false,
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    icon: "💎",
    capabilities: ["text", "vision", "web", "reasoning"],
    available: false,
  },
];

// yolo
export const focusInput = () => {
  console.log("focusInput");
  const input = document.getElementById("chat-input");
  if (input) {
    requestAnimationFrame(() => {
      input.focus();
    });
  }
};

export default function TmpChatInput({
  isLoading,
  isStreaming,
  input,
  onChange,
  onSubmit,
  showScrollToBottom,
  onScrollToBottomClick,
}: TmpChatInputProps) {
  const [selectedModel, setSelectedModel] = useState(models[0]);

  useEffect(() => {
    // Automatically focus the input on initial render
    focusInput();
  }, []);

  const { currentThreadId } = useChatState();
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming || isLoading) {
        console.log("waiting for streaming to finish");
        return;
      }
      // TODO change this horrible type cast
      onSubmit?.(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case "vision":
        return <EyeIcon className="h-4 w-4" />;
      case "web":
        return <GlobeIcon className="h-4 w-4" />;
      case "text":
        return <FileTextIcon className="h-4 w-4" />;
      case "reasoning":
        return <BrainIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-0 z-10 w-full px-4">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        {showScrollToBottom && (
          <div className="pb-4">
            <Button
              variant="outline"
              onClick={onScrollToBottomClick}
              className="pointer-events-auto flex h-8 items-center gap-2 whitespace-nowrap rounded-full border border-secondary/40 bg-accent/50 px-3 text-xs font-medium text-secondary-foreground/70 backdrop-blur-md hover:bg-secondary"
            >
              <span className="pb-0.5">Scroll to bottom</span>
              <ChevronDownIcon className="-mr-1 h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="group pointer-events-auto w-full rounded-t-[20px] bg-accent/50 p-2 pb-0 backdrop-blur-md">
          <form
            onSubmit={onSubmit}
            className="flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 border-white/100 bg-background/50 px-3 pt-3 text-secondary-foreground dark:border-white/10 pb-[env(safe-area-inset-bottom)]"
            style={{
              boxShadow:
                "rgba(0, 0, 0, 0.1) 0px 80px 50px 0px, rgba(0, 0, 0, 0.07) 0px 50px 30px 0px, rgba(0, 0, 0, 0.06) 0px 30px 15px 0px, rgba(0, 0, 0, 0.04) 0px 15px 8px, rgba(0, 0, 0, 0.04) 0px 6px 4px, rgba(0, 0, 0, 0.02) 0px 2px 2px",
            }}
          >
            <div className="flex flex-grow flex-col">
              <div className="flex flex-grow flex-row items-start">
                <TextareaAutosize
                  id="chat-input"
                  value={input}
                  autoFocus={true}
                  onChange={onChange}
                  onKeyDown={handleKeyDown}
                  placeholder={currentThreadId ?? "Type your message here..."}
                  className="w-full resize-none bg-transparent text-base leading-6 text-foreground outline-none border-none shadow-none focus-visible:ring-0 backdrop-blur-md placeholder:text-secondary-foreground/60 disabled:opacity-50"
                  maxRows={15}
                  minRows={2}
                  tabIndex={-1}
                />
              </div>
              <div className="-mb-px mt-2 flex w-full flex-row-reverse justify-between pb-3">
                <div className="-mr-0.5 -mt-0.5 flex items-center justify-center gap-2">
                  <button
                    type="submit"
                    disabled={isLoading || isStreaming || !input?.trim()}
                    className={cn(
                      "h-9 w-9 rounded-lg font-semibold shadow-sm relative overflow-hidden transition-all duration-200 flex items-center justify-center border",
                      isStreaming
                        ? "border-destructive/50 bg-destructive/10 hover:bg-destructive/20 text-destructive"
                        : "border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    )}
                  >
                    <span className="sr-only">
                      {isStreaming ? "Stop" : "Send"}
                    </span>
                    <div className="relative h-5 w-5">
                      <ArrowUpIcon
                        className={cn(
                          "absolute h-5 w-5 transition-all duration-300",
                          isStreaming
                            ? "opacity-0 -translate-y-full"
                            : "opacity-100 translate-y-0"
                        )}
                      />
                      <SquareIcon
                        className={cn(
                          "absolute h-5 w-5 transition-all duration-300",
                          isStreaming
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-full"
                        )}
                      />
                    </div>
                  </button>
                </div>
                <div className="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center">
                  <div className="ml-[-7px] flex items-center gap-1">
                    {/* Model Selector */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 rounded-md text-xs relative gap-2 px-2 py-1.5 -mb-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        >
                          <div className="text-left text-sm font-medium">
                            {selectedModel.name}
                          </div>
                          <ChevronDownIcon className="right-0 size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-80 max-h-96 overflow-y-auto"
                        align="start"
                      >
                        {models.map((model) => (
                          <DropdownMenuItem
                            key={model.id}
                            onClick={() => setSelectedModel(model)}
                            disabled={!model.available}
                            className={cn(
                              "flex flex-col items-start gap-1 p-3 cursor-pointer",
                              !model.available &&
                                "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-2 pr-2 font-medium text-muted-foreground">
                                <span className="text-lg">{model.icon}</span>
                                <span className="w-fit">{model.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {model.capabilities.map((capability) => (
                                  <div
                                    key={capability}
                                    className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md text-primary/70 bg-primary/10"
                                  >
                                    {getCapabilityIcon(capability)}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground/70">
                              {model.provider} •{" "}
                              {model.available ? "Available" : "Pro only"}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Search Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs -mb-1.5 h-auto gap-2 rounded-full border border-solid border-secondary-foreground/10 py-1.5 pl-2 pr-2.5 text-muted-foreground max-sm:p-2 hover:bg-muted/40 hover:text-foreground"
                      aria-label="Web search"
                    >
                      <GlobeIcon className="h-4 w-4" />
                      <span className="max-sm:hidden">Search</span>
                    </Button>

                    {/* File Attach Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs -mb-1.5 h-auto gap-2 rounded-full border border-solid border-secondary-foreground/10 px-2 py-1.5 pr-2.5 text-muted-foreground max-sm:p-2 hover:bg-muted/40 hover:text-foreground"
                      aria-label="Attach files"
                    >
                      <PaperclipIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
