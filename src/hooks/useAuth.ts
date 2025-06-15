import { useEffect, useMemo, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useLocalCache } from "@/providers/LocalCacheProvider";
import { useChatActions } from "@/providers/ChatStateProvider";

export type ClerkUser = ReturnType<typeof useUser>["user"];

type AuthState =
  | "0_clerk_loading"
  | "1_clerk_loaded"
  | "1__A_clerk_signed_in"
  | "1__B_clerk_signed_out"
  | "2_convex_authenticated"
  | "3_user_ready";

/**
 * Enhanced auth hook that manages the full Clerk to Convex authentication lifecycle.
 * It provides clear state flags for building a snappy and robust UI.
 */
function useAuth_INTERNAL() {
  // Stage 1: Clerk Authentication
  const {
    user: _1_clerkUser,
    isLoaded: _1_isClerkLoaded,
    isSignedIn: _1_isClerkSignedIn,
  } = useUser();

  // Stage 2: Convex Client Authentication
  const {
    isLoading: _2_isConvexAuthLoading,
    isAuthenticated: _2_isConvexAuthenticated,
  } = useConvexAuth();

  // Stage 3: Application-level user setup
  const ensureConvexUserExists = useMutation(api.users.ensureUserExists);
  const [_3_isUserEnsured, setIsUserEnsured] = useState(false);

  useEffect(() => {
    // skip if stage 3 already ran
    if (_3_isUserEnsured) return;

    // skip if stage 2 is not authenticated
    if (!_2_isConvexAuthenticated) return;

    // ensure user exists
    const ensureUser = async () => {
      try {
        await ensureConvexUserExists();
        setIsUserEnsured(true);
      } catch (error) {
        console.error("Failed to ensure user exists in Convex:", error);
        // Optionally handle error state here
      }
    };
    ensureUser();
  }, [_2_isConvexAuthenticated, _3_isUserEnsured, ensureConvexUserExists]);

  // Clean up state on sign out
  const { signOut: clerkSignOut } = useClerkAuth();
  const { clear: clearLocalCache } = useLocalCache();
  const { clear: clearChatState } = useChatActions();

  const signOut = async (...args: Parameters<typeof clerkSignOut>) => {
    const [callback, options] = args;
    const wrappedCallback = () => {
      setIsUserEnsured(false);
      clearChatState();
      callback?.();
      clearLocalCache();
    };
    await clerkSignOut(wrappedCallback, options);
    // reload the page
    window.location.reload();
  };

  const authState: AuthState = useMemo(() => {
    if (!_1_isClerkLoaded) return "0_clerk_loading";
    if (_1_isClerkLoaded && !_1_isClerkSignedIn) return "1__B_clerk_signed_out";
    if (_1_isClerkLoaded && _1_isClerkSignedIn && !_2_isConvexAuthenticated)
      return "1__A_clerk_signed_in";
    if (
      _1_isClerkLoaded &&
      _1_isClerkSignedIn &&
      _2_isConvexAuthenticated &&
      !_3_isUserEnsured
    )
      return "2_convex_authenticated";
    if (
      _1_isClerkLoaded &&
      _1_isClerkSignedIn &&
      _2_isConvexAuthenticated &&
      _3_isUserEnsured
    )
      return "3_user_ready";
    return "0_clerk_loading";
  }, [
    _1_isClerkLoaded,
    _1_isClerkSignedIn,
    _2_isConvexAuthenticated,
    _3_isUserEnsured,
  ]);

  return {
    // Raw state from hooks
    clerkUser: _1_clerkUser,

    // stage 1
    isClerkLoaded: _1_isClerkLoaded,
    isClerkSignedIn: _1_isClerkSignedIn,

    // stage 2
    isConvexAuthLoading: _2_isConvexAuthLoading,
    isConvexAuthenticated: _2_isConvexAuthenticated,

    // stage 3
    isConvexUserEnsured: _3_isUserEnsured,

    /**
     * The current state string of the authentication process.
     */
    authState,

    // Actions
    signOut,
  };
}

export function useRawAuthStates() {
  const {
    clerkUser,
    isClerkLoaded,
    isClerkSignedIn,
    isConvexAuthLoading,
    isConvexAuthenticated,
    isConvexUserEnsured,
    authState,
  } = useAuth_INTERNAL();

  return {
    clerkUser,
    isClerkLoaded,
    isClerkSignedIn,
    isConvexAuthLoading,
    isConvexAuthenticated,
    isConvexUserEnsured,
    authState,
  };
}

export function useAuth() {
  const {
    clerkUser,
    isClerkLoaded,
    isClerkSignedIn,
    isConvexAuthLoading,
    isConvexAuthenticated,
    isConvexUserEnsured,
  } = useAuth_INTERNAL();

  return {
    clerkUser,
    isLoadingClerk: !isClerkLoaded,
    isSignedInClerk: isClerkSignedIn,
    isLoadingConvex: isConvexAuthLoading,
    isAuthenticatedConvex: isConvexAuthenticated,
    isFullyReady: isConvexUserEnsured,
    isAnonymous: isClerkLoaded && !isClerkSignedIn,
  };
}

export function useAuthActions() {
  const { signOut } = useAuth_INTERNAL();

  return {
    signOut,
    // TODO: add other actions here
  };
}
