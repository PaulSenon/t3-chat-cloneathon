"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MenuIcon, SendIcon, BotIcon } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { useChat } from "@ai-sdk/react";

/**
 * Simple chat interface component
 *
 * Minimalist design with:
 * - Basic ShadCN components
 * - Simple layout with window scroll
 * - Clean AI SDK integration
 * - Easy to extend and modify
 */
export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      id: "1",
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-scroll overscroll-contain">
      <div className="max-w-3xl mx-auto space-y-5 p-4">
        <div className="aria-hidden h-10"></div>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BotIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Start a conversation</h2>
            <p className="text-muted-foreground">
              Send a message to begin chatting.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={{
                id: message.id,
                content: message.content,
                role: message.role as "user" | "assistant",
                timestamp: message.createdAt || new Date(),
              }}
            />
          ))
        )}
        <div className="aria-hidden h-40"></div>
      </div>

      {/* Input */}
      <div className="pointer-events-none absolute bottom-0 z-10 w-full px-4">
        <div className="relative mx-auto flex w-full max-w-3xl flex-col text-center">
          <div className="pointer-events-auto border-reflect rounded-t-[20px] bg-accent/10 p-2 pb-0 backdrop-blur-md">
            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 border-white/90 bg-background/50 px-3 pt-3 text-secondary-foreground dark:border-white/10"
              style={{
                boxShadow:
                  "rgba(0, 0, 0, 0.1) 0px 80px 50px 0px, rgba(0, 0, 0, 0.07) 0px 50px 30px 0px, rgba(0, 0, 0, 0.06) 0px 30px 15px 0px, rgba(0, 0, 0, 0.04) 0px 15px 8px, rgba(0, 0, 0, 0.04) 0px 6px 4px, rgba(0, 0, 0, 0.02) 0px 2px 2px",
              }}
            >
              <div className="flex flex-grow flex-col">
                <div className="flex flex-grow flex-row items-start">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className="w-full resize-none bg-transparent text-base leading-6 text-foreground outline-none border-none shadow-none focus-visible:ring-0 placeholder:text-secondary-foreground/60 disabled:opacity-50"
                    disabled={isLoading}
                    style={{ height: "48px !important" }}
                  />
                </div>
                <div className="-mb-px mt-2 flex w-full flex-row-reverse justify-between pb-3">
                  <div className="-mr-0.5 -mt-0.5 flex items-center justify-center">
                    <Button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="h-9 w-9 rounded-lg bg-primary font-semibold shadow hover:bg-primary/90 disabled:opacity-50"
                    >
                      <SendIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
