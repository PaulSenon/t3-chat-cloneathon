"use client";

import {
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
} from "@clerk/nextjs";
import React from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";

import { useAuthActions } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentPropsWithoutRef<typeof Button>;

/**
 * A custom Sign-In button that uses ShadCN's Button component and
 * opens Clerk's sign-in flow in a modal.
 */
export const SignInButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return (
      <ClerkSignInButton mode="modal">
        <Button {...props} ref={ref}>
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </ClerkSignInButton>
    );
  }
);
SignInButton.displayName = "SignInButton";

/**
 * A custom Sign-Up button that uses ShadCN's Button component and
 * opens Clerk's sign-up flow in a modal.
 */
export const SignUpButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return (
      <ClerkSignUpButton mode="modal">
        <Button {...props} ref={ref}>
          <UserPlus className="mr-2 h-4 w-4" />
          Sign Up
        </Button>
      </ClerkSignUpButton>
    );
  }
);
SignUpButton.displayName = "SignUpButton";

/**
 * A custom Sign-Out button that uses the signOut action from our auth hook.
 */
export const SignOutButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { signOut } = useAuthActions();
    const handleSignOut = () => {
      signOut();
    };

    return (
      <Button onClick={handleSignOut} {...props} ref={ref}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    );
  }
);
SignOutButton.displayName = "SignOutButton";
