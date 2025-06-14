import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SendIcon } from "lucide-react";
import { useChatCache } from "@/providers/ChatCacheProvider";
import { useChat } from "@ai-sdk/react";

export interface TmpChatInputProps {
  input?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled: boolean;
}

const MemoButton = React.memo(Button);
const MemoTextarea = React.memo(Textarea);

export default function TmpChatInput({
  disabled,
  input,
  onChange,
  onSubmit,
}: TmpChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // TODO change this horrible type cast
      onSubmit?.(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-0 z-10 w-full px-4">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col text-center">
        <div className="pointer-events-auto border-reflect rounded-t-[20px] bg-accent/50 p-2 pb-0 backdrop-blur-md">
          <form
            onSubmit={onSubmit}
            className="flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 border-white/90 bg-background/50 dark:bg-background-none px-3 pt-3 text-secondary-foreground dark:border-white/10"
            style={{
              boxShadow:
                "rgba(0, 0, 0, 0.1) 0px 80px 50px 0px, rgba(0, 0, 0, 0.07) 0px 50px 30px 0px, rgba(0, 0, 0, 0.06) 0px 30px 15px 0px, rgba(0, 0, 0, 0.04) 0px 15px 8px, rgba(0, 0, 0, 0.04) 0px 6px 4px, rgba(0, 0, 0, 0.02) 0px 2px 2px",
            }}
          >
            <div className="flex flex-grow flex-col">
              <div className="flex flex-grow flex-row items-start">
                <MemoTextarea
                  value={input}
                  onChange={onChange}
                  onKeyDown={handleKeyDown}
                  placeholder={currentThreadId ?? "null"}
                  className="w-full resize-none bg-transparent dark:bg-transparent text-base leading-6 text-foreground outline-none border-none shadow-none focus-visible:ring-0 placeholder:text-secondary-foreground/60 disabled:opacity-50"
                  style={{ height: "48px !important" }}
                />
              </div>
              <div className="-mb-px mt-2 flex w-full flex-row-reverse justify-between pb-3">
                <div className="-mr-0.5 -mt-0.5 flex items-center justify-center">
                  <MemoButton
                    type="submit"
                    disabled={disabled}
                    className="h-9 w-9 rounded-lg bg-primary font-semibold shadow hover:bg-primary/90 disabled:opacity-50"
                  >
                    <SendIcon className="h-5 w-5" />
                  </MemoButton>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
