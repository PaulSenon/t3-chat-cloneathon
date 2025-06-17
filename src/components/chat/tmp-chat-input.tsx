import React, { useEffect } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
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
  InfoIcon,
  CodeIcon,
} from "lucide-react";
import { DynamicCustomIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Model, ModelCapabilities, modelsConfig } from "@/types/aiModels";

export interface TmpChatInputProps {
  input?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isStreaming?: boolean;
  showScrollToBottom: boolean;
  onScrollToBottomClick: () => void;
  selectedModel?: Model;
  setSelectedModel: (modelId: string) => void;
}

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
  selectedModel,
  setSelectedModel,
}: TmpChatInputProps) {
  const canSubmit =
    !isLoading && !isStreaming && input && input.trim().length > 0;
  const canStop = isStreaming;

  useEffect(() => {
    // Automatically focus the input on initial render
    focusInput();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!canSubmit) {
        console.log("waiting for streaming to finish");
        return;
      }
      // TODO change this horrible type cast
      onSubmit?.(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-0 z-10 w-full px-4">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        {showScrollToBottom && (
          <div className="pb-4">
            <ScrollToBottomButtonPure
              onScrollToBottomClick={onScrollToBottomClick}
            />
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
                <TextareaPure
                  input={input}
                  onChange={onChange}
                  handleKeyDown={handleKeyDown}
                  minRows={2}
                  maxRows={15}
                  placeholder={"Type your message here..."}
                  className="w-full resize-none bg-transparent text-base leading-6 text-foreground outline-none border-none shadow-none focus-visible:ring-0 backdrop-blur-md placeholder:text-secondary-foreground/60 disabled:opacity-50"
                />
              </div>
              <div className="-mb-px mt-2 flex w-full flex-row-reverse justify-between pb-3">
                <div className="-mr-0.5 -mt-0.5 flex items-center justify-center gap-2">
                  <SubmitButtonPure
                    state={isStreaming ? "stop" : "send"}
                    disabled={!canStop && !canSubmit}
                  />
                </div>
                <div className="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center">
                  <div className="ml-[-7px] flex items-center gap-1">
                    <ModelSelectorPure
                      isPremiumUser={false} // TODO: get from user
                      models={modelsConfig}
                      selectedModel={selectedModel}
                      setSelectedModel={setSelectedModel}
                      disabled={isLoading}
                    />
                    <ModelOptionSearchPure />
                    <ModelOptionFileAttachPure />
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

// TODO: UI placeholder
const ModelOptionFileAttachPure = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className=" gap-2 -mb-1.5">
          <Button
            disabled={true}
            type="button"
            variant="ghost"
            className="text-xs h-auto rounded-full border border-solid border-secondary-foreground/10 py-1.5 pl-2 pr-2.5 text-muted-foreground max-sm:p-2 hover:bg-muted/40 hover:text-foreground"
            aria-label="Web search"
          >
            <PaperclipIcon className="size-4" />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">not available yet</p>
      </TooltipContent>
    </Tooltip>
  );
};

// TODO: UI placeholder

const ModelOptionSearchPure = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className=" gap-2 -mb-1.5">
          <Button
            disabled={true}
            type="button"
            variant="ghost"
            className="text-xs h-auto rounded-full border border-solid border-secondary-foreground/10 py-1.5 pl-2 pr-2.5 text-muted-foreground max-sm:p-2 hover:bg-muted/40 hover:text-foreground"
            aria-label="Web search"
          >
            <GlobeIcon className="h-4 w-4" />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">not available yet</p>
      </TooltipContent>
    </Tooltip>
  );
};

const ScrollToBottomButtonPure = ({
  onScrollToBottomClick,
}: {
  onScrollToBottomClick: () => void;
}) => {
  return (
    // TODO: transition on appear
    <Button
      variant="outline"
      onClick={onScrollToBottomClick}
      className="pointer-events-auto flex h-8 items-center gap-2 whitespace-nowrap rounded-full border border-secondary/40 bg-accent/50 px-3 text-xs font-medium text-secondary-foreground/70 backdrop-blur-md hover:bg-secondary"
    >
      <span>Scroll to bottom</span>
      <ChevronDownIcon className="-mr-1 h-4 w-4" />
    </Button>
  );
};

const TextareaPure = ({
  input,
  onChange,
  handleKeyDown,
  minRows,
  maxRows,
  placeholder,
  className,
}: {
  input?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown?: (e: React.KeyboardEvent) => void;
  minRows?: number;
  maxRows?: number;
  placeholder?: string;
  className?: string;
}) => {
  return (
    <TextareaAutosize
      id="chat-input"
      value={input}
      autoFocus={true}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      maxRows={maxRows}
      minRows={minRows}
    />
  );
};

const SubmitButtonPure = ({
  state,
  disabled,
}: {
  state: "stop" | "send";
  disabled: boolean;
}) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "h-9 w-9 rounded-lg font-semibold shadow-sm relative overflow-hidden transition-all duration-200 flex items-center justify-center border",
        state === "stop"
          ? "border-destructive/50 bg-destructive/10 hover:bg-destructive/20 text-destructive"
          : state === "send"
            ? "border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary"
            : "",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      <span className="sr-only">{state === "stop" ? "Stop" : "Send"}</span>
      <div className="relative h-5 w-5">
        <ArrowUpIcon
          className={cn(
            "absolute h-5 w-5 transition-all duration-300",
            state === "send"
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-full"
          )}
        />
        <SquareIcon
          className={cn(
            "absolute h-5 w-5 transition-all duration-300",
            state === "stop"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-full"
          )}
        />
      </div>
    </button>
  );
};

const CapabilityIcon = ({ capability }: { capability: ModelCapabilities }) => {
  switch (capability) {
    case "vision":
      return <EyeIcon className="h-4 w-4" />;
    case "web":
      return <GlobeIcon className="h-4 w-4" />;
    case "text":
      return <FileTextIcon className="h-4 w-4" />;
    case "reasoning":
      return <BrainIcon className="h-4 w-4" />;
    case "code":
      return <CodeIcon className="h-4 w-4" />;
    default:
      return null;
  }
};

const ModelSelectorItemPure = ({
  model,
  setSelectedModel,
  disabled,
}: {
  model: Model;
  setSelectedModel: (modelId: string) => void;
  disabled?: boolean;
}) => {
  return (
    <DropdownMenuItem
      key={model.id}
      onClick={() => setSelectedModel(model.id)}
      disabled={!model.isAvailable || disabled}
      className={cn(
        "flex flex-col items-start gap-1 p-3 cursor-pointer",
        !model.isAvailable && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 pr-2 font-medium text-muted-foreground">
          <DynamicCustomIcon icon={model.icon} />
          <span className="w-fit">{model.name}</span>

          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-3 text-muted-foreground hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">{model.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1">
          {model.capabilities.map((capability) => (
            <div
              key={capability}
              className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md text-primary/70 bg-primary/10"
            >
              <Tooltip>
                <TooltipTrigger>
                  <CapabilityIcon capability={capability} />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{capability}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </DropdownMenuItem>
  );
};

const ModelSelectorPure = ({
  models,
  selectedModel,
  setSelectedModel,
  disabled,
  isPremiumUser,
}: {
  // TODO: plug with global typed model config
  models: Model[];
  selectedModel?: Model;
  setSelectedModel: (modelId: string) => void;
  disabled: boolean;
  isPremiumUser: boolean;
}) => {
  const premiumModels = models.filter((model) => model.isPremium);
  const freeModels = models.filter((model) => !model.isPremium);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-8 rounded-md text-xs relative gap-2 px-2 py-1.5 -mb-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {selectedModel ? (
            <div className="text-left text-sm font-medium">
              {selectedModel.name}
            </div>
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
          <ChevronDownIcon className="right-0 size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-h-96 overflow-y-auto"
        align="start"
      >
        <DropdownMenuLabel className="text-xs font-medium">
          Free models
        </DropdownMenuLabel>
        {freeModels.map((model) => (
          <ModelSelectorItemPure
            key={model.id}
            model={model}
            setSelectedModel={setSelectedModel}
          />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium">
          Premium models
        </DropdownMenuLabel>
        {premiumModels.map((model) => (
          <ModelSelectorItemPure
            disabled={!isPremiumUser}
            key={model.id}
            model={model}
            setSelectedModel={setSelectedModel}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
