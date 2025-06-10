import { useEffect, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Enhanced auth hook that automatically ensures user exists in Convex DB
 *
 * This wraps useConvexAuth and automatically calls ensureUserExists when
 * the user becomes authenticated, making the RLS pattern completely automatic.
 */
export function useAuth() {
  const { isLoading: isLoadingClerk, isAuthenticated: isAuthenticatedClerk } =
    useConvexAuth();
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  const [isUserReady, setIsUserReady] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const ensureUserExistsAsync = async () => {
      try {
        await ensureUserExists();
        setIsUserReady(true);
      } catch (error) {
        console.error("Failed to ensure user exists:", error);
      } finally {
        setIsFinished(true);
      }
    };

    if (isAuthenticatedClerk && !isUserReady) {
      ensureUserExistsAsync();
    }
  }, [isAuthenticatedClerk, isUserReady, ensureUserExists]);

  return {
    isLoading: isLoadingClerk || (isAuthenticatedClerk && !isFinished),
    isAuthenticated: isAuthenticatedClerk && isUserReady,
  };
}
