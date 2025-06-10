"use client";

import React from "react";
// import { ClerkProvider, useAuth } from "@clerk/nextjs";
// import { ConvexProviderWithClerk } from "convex/react-clerk";
// import { ConvexReactClient } from "convex/react";
// import { env } from "../env";

// TODO: Uncomment when environment variables are set up
// const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Simplified providers for UI demo
 * 
 * When ready to integrate with Clerk and Convex:
 * 1. Set up environment variables in .env.local
 * 2. Uncomment the imports and provider setup above
 * 3. Replace the simple div wrapper with ClerkProvider and ConvexProviderWithClerk
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
  
  // TODO: Replace with this when environment variables are configured:
  /*
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
  */
}
