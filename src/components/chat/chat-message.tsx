"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  SquarePen,
  RefreshCcw,
  ChevronDown,
  Link as LinkIcon,
  Cog,
  CheckCircle,
  XCircle,
  Code,
} from "lucide-react";
import { UIMessage } from "ai";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BrainIcon } from "@/components/icons";
import { Markdown } from "@/components/ui/markdown";

interface ChatMessageProps {
  message: UIMessage;
  onRetry?: () => void;
  onEdit?: () => void;
  isStale: boolean;
  isStreaming: boolean;
}

/**
 * Clean chat message component matching the reference design
 */
export const ChatMessage = React.memo(function ChatMessage({
  message,
  onRetry,
  onEdit,
  isStale, // Stale at this level for future lazy loading of messages for long threads
  isStreaming,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [showRaw, setShowRaw] = useState(false);
  console.log("MESSAGE", message);

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(timestamp);
  };

  return (
    <div className={cn("group flex flex-col", isUser && "items-end")}>
      {/* <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowRaw(!showRaw)}>
          <Code className="h-4 w-4" />
        </Button>
      </div> */}
      <div
        role="article"
        aria-label={isUser ? "Your message" : "Assistant message"}
        className={cn(
          "relative break-words rounded-xl px-4 py-3 text-left transition-discrete duration-250 max-w-[80%]",
          isUser
            ? "border border-secondary/50 bg-secondary "
            : "bg-transparent min-w-[80%] max-w-full px-0",
          isStale && "opacity-50"
        )}
      >
        <span className="sr-only">
          {isUser ? "Your message: " : "Assistant message: "}
        </span>

        <div className="flex flex-col gap-3 relative">
          {message.parts.map((part, i) => {
            const isLastPart = i === message.parts.length - 1;
            switch (part.type) {
              case "text":
                return (
                  <TextBlock
                    key={`${part.type}-${i}`}
                    textPart={part}
                    messageId={message.id}
                    showRaw={showRaw}
                  />
                );
              case "step-start":
                return (
                  <StepStartBlock
                    key={`${part.type}-${i}`}
                    isLoading={isStreaming && isLastPart}
                    className="w-full"
                  />
                );
              case "source":
                return (
                  <SourceBlock
                    key={`${part.type}-${i}`}
                    sourcePart={part}
                    className="w-full"
                  />
                );
              case "reasoning":
                return (
                  <ReasoningBlock
                    key={`${part.type}-${i}`}
                    reasoningPart={part}
                    isLoading={isStreaming && isLastPart}
                    messageId={message.id}
                    showRaw={showRaw}
                    className="w-full"
                  />
                );
              case "tool-invocation":
                return (
                  <ToolInvocationBlock
                    key={`${part.type}-${i}`}
                    toolInvocationPart={part}
                    className="w-full"
                  />
                );

              // case "file":
              //   return <div key={i}>FILE</div>;
            }
          })}
        </div>
      </div>
      {/* Action buttons - only show on hover */}
      <MessageActions
        message={message}
        onRetry={onRetry}
        onEdit={onEdit}
        isUser={isUser}
        className={cn(
          "group-focus:opacity-100 group-hover:opacity-100 group-active:opacity-100 opacity-0 transition-opacity",
          isUser && "mt-2"
        )}
      />
    </div>
  );
});

const MessageActions = ({
  message,
  onRetry,
  onEdit,
  isUser,
  className,
}: {
  message: UIMessage;
  onRetry?: () => void;
  onEdit?: () => void;
  isUser: boolean;
  className?: string;
}) => {
  return (
    <div
      className={cn("flex flex-row justify-start gap-1 sm:w-auto", className)}
    >
      <div className="flex items-center gap-1">
        <CopyButton
          text={message.content}
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-lg p-0 text-xs hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50"
          aria-label="Copy response to clipboard"
        />

        {isUser && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-lg p-0 text-xs hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50"
            onClick={onEdit}
            aria-label="Edit message"
          >
            <div className="relative size-4">
              <SquarePen className="h-4 w-4 absolute inset-0" />
            </div>
          </Button>
        )}

        {!isUser && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-lg p-0 text-xs hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50"
            onClick={onRetry}
            aria-label="Retry message"
          >
            <div className="relative size-4">
              <RefreshCcw className="h-4 w-4 absolute inset-0" />
              <span className="sr-only">Retry</span>
            </div>
          </Button>
        )}
      </div>

      {/* Model name display for assistant messages */}
      {/* TODO: add model name display */}
      {/* {!isUser && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>GPT-4</span>
        </div>
      )} */}
    </div>
  );
};

const LoaderAnimation = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
    </div>
  );
};

// Part-specific UI component types
type AnyUIPart = UIMessage["parts"][number];

const TextBlock = ({
  textPart,
  messageId,
  showRaw,
}: {
  textPart: AnyUIPart & { type: "text" };
  messageId?: string;
  showRaw: boolean;
}) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:my-0 prose-pre:p-0">
      {showRaw ? textPart.text : <Markdown>{textPart.text}</Markdown>}
    </div>
  );
};

const StepStartBlock = ({
  isLoading,
  className,
}: {
  isLoading: boolean;
  className?: string;
}) => {
  if (!isLoading) return null;
  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center gap-2">
        <LoaderAnimation />
      </div>
    </div>
  );
};

const SourceBlock = ({
  sourcePart,
  className,
}: {
  sourcePart: AnyUIPart & { type: "source" };
  className?: string;
}) => {
  const { sourceType, url, title } = sourcePart.source;
  if (sourceType !== "url") return null;

  return (
    <div
      className={cn(
        "bg-muted/50 rounded-lg border border-border/50 overflow-hidden",
        className
      )}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 hover:bg-muted/80 transition-colors"
      >
        <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium text-foreground truncate">
            {title}
          </span>
          <span className="text-xs text-muted-foreground truncate">{url}</span>
        </div>
      </a>
    </div>
  );
};

const ToolInvocationBlock = ({
  toolInvocationPart,
  className,
}: {
  toolInvocationPart: AnyUIPart & { type: "tool-invocation" };
  className?: string;
}) => {
  const { toolName, state: toolState } = toolInvocationPart.toolInvocation;

  let icon: React.ReactNode;
  let text: string;
  let statusClasses = "text-muted-foreground";

  switch (toolState as string) {
    case "call":
      icon = <Cog className="h-4 w-4 animate-spin" />;
      text = `Using tool: ${toolName}`;
      break;
    case "partial-call":
      icon = <Cog className="h-4 w-4" />;
      text = `Using tool: ${toolName}`;
      break;
    case "result":
      icon = <CheckCircle className="h-4 w-4" />;
      text = `Tool ${toolName} finished`;
      statusClasses = "text-green-600 dark:text-green-500";
      break;
    case "error":
      icon = <XCircle className="h-4 w-4" />;
      text = `Error in tool: ${toolName}`;
      statusClasses = "text-red-600 dark:text-red-500";
      break;
    default:
      return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md p-3 border text-sm",
        "bg-muted/40 border-border/50",
        statusClasses,
        className
      )}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};

const ReasoningBlock = ({
  className,
  reasoningPart,
  isLoading,
  messageId,
  showRaw,
}: {
  className?: string;
  reasoningPart: AnyUIPart & { type: "reasoning" };
  isLoading: boolean;
  messageId?: string;
  showRaw: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // TODO: collect timestamp
  const [thinkingTime] = useState(Math.floor(Math.random() * 5) + 2); // Random
  // 2-6 seconds

  // Loading state - disabled and shows loading indicator
  if (isLoading) {
    return (
      <div className={cn("p-3", className)}>
        <div className="flex items-center gap-2">
          <BrainIcon className="h-4 w-4 animate-pulse" />
          <LoaderAnimation />
        </div>
      </div>
      // <div
      //   className={cn(
      //     "rounded-lg border border-transparent bg-transparent p-3",
      //     className
      //   )}
      // >
      //   <div className="flex items-center gap-2 text-muted-foreground">
      //     <BrainIcon className="h-4 w-4 animate-pulse" />
      //     <span className="text-sm">Reasoning</span>
      //     <div className="ml-auto flex items-center space-x-1">
      //       <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      //       <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      //       <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce"></div>
      //     </div>
      //   </div>
      // </div>
    );
  }

  // Interactive collapsible state
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-lg border border-border/50 bg-muted/50 ",
        className
      )}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 p-3 h-auto text-left hover:bg-muted/50 transition-colors"
        >
          <BrainIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Thought for {thinkingTime} sec
          </span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="pt-2 border-t border-border/30">
          <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground prose-pre:my-0 prose-pre:p-0">
            {showRaw ? (
              reasoningPart.reasoning
            ) : (
              <Markdown>{reasoningPart.reasoning}</Markdown>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
