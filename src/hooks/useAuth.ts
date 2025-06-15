import { useEffect, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useClerk, useUser } from "@clerk/nextjs";
import { useLocalCache } from "@/providers/LocalCacheProvider";
import { useChatActions } from "@/providers/ChatStateProvider";

/**
 * Enhanced auth hook that automatically ensures user exists in Convex DB
 *
 * This wraps useConvexAuth and automatically calls ensureUserExists when
 * the user becomes authenticated, making the RLS pattern completely automatic.
 */
export function useAuth() {
  const { clear: clearLocalCache } = useLocalCache();
  const { clear: clearChatState } = useChatActions();
  const { isLoading: isLoadingClerk, isAuthenticated: isAuthenticatedClerk } =
    useConvexAuth();
  const {
    user: clerkUser,
    isLoaded: isLoadedClerk,
    isSignedIn: isSignedInClerk,
  } = useUser();
  const { signOut } = useClerk();
  const ensureConvexUserExists = useMutation(api.users.ensureUserExists);
  const [isConvexUserReady, setIsConvexUserReady] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const ensureUserExistsAsync = async () => {
      try {
        const user = await ensureConvexUserExists();
        if (user) {
          setIsConvexUserReady(true);
        }
      } catch (error) {
        console.error("Failed to ensure user exists:", error);
      } finally {
        setIsFinished(true);
      }
    };

    if (isAuthenticatedClerk && !isConvexUserReady) {
      ensureUserExistsAsync();
    }
  }, [isAuthenticatedClerk, isConvexUserReady, ensureConvexUserExists]);

  const _signOut = () => {
    signOut();
    clearChatState();
    clearLocalCache();
  };

  return {
    // faster query, but we don't know if user exists in Convex DB. Only checks clerk auth
    isAuthenticating: isLoadingClerk,
    isAuthenticated: isAuthenticatedClerk,

    // 1 query slower but when we need to be sure that user also exists in Convex DB
    isFullyLoggedIn: isAuthenticatedClerk && isConvexUserReady,
    isFinished,

    clerkUser,
    isUserLoaded: isLoadedClerk,
    isUserSignedIn: isSignedInClerk,
    signOut: _signOut,
  };
}
