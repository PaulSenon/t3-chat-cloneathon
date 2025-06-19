"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { env } from "@/env";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ChatStateProvider } from "./providers/ChatStateProvider";
import { LocalCacheProvider } from "./providers/LocalCacheProvider";
import { ChatListStateProvider } from "./providers/ChatListStateProvider";
import { TooltipProvider } from "./components/ui/tooltip";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ConvexQueryCacheProvider
          expiration={60_000}
          maxIdleEntries={100}
          debug={false}
        >
          <TooltipProvider delayDuration={0} skipDelayDuration={0}>
            <LocalCacheProvider>
              <ChatStateProvider>
                <ChatListStateProvider>{children}</ChatListStateProvider>
              </ChatStateProvider>
            </LocalCacheProvider>
          </TooltipProvider>
        </ConvexQueryCacheProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
