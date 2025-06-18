"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ClerkUser, useAuth, useAuthActions } from "@/hooks/useAuth";
import { SignInButton } from "./auth-button";
import { useColdCachedQuery } from "@/hooks/useColdCachedQuery";
import { api } from "../../../convex/_generated/api";
import { useClerk } from "@clerk/nextjs";
import { useSidebar } from "../ui/sidebar";

interface UserProfileButtonProps {
  className?: string;
}

export function UserProfileButton({ className }: UserProfileButtonProps) {
  const { clerkUser, isFullyReady, isLoadingClerk, isAnonymous } = useAuth();

  const disabled = !isFullyReady;

  if (isAnonymous) {
    return <SignInButton />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-3 p-2 h-auto hover:bg-accent hover:border data-[state=open]:bg-accent data-[state=open]:border",
            className
          )}
          disabled={disabled}
        >
          <UserAvatar
            isLoading={isLoadingClerk}
            isAnonymous={isAnonymous}
            clerkUser={clerkUser}
          />
          <UserInfos
            isLoading={isLoadingClerk}
            isAnonymous={isAnonymous}
            clerkUser={clerkUser}
          />

          <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 bg-background/50 backdrop-blur-md"
        align="start"
        forceMount
      >
        <UserDropDownMenuContent
          isFullyReady={isFullyReady}
          isAnonymous={isAnonymous}
          clerkUser={clerkUser}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const UserAvatar = ({
  isLoading,
  isAnonymous,
  clerkUser,
}: {
  isLoading: boolean;
  isAnonymous: boolean;
  clerkUser?: ClerkUser;
}) => {
  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (isAnonymous) {
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-sm">A</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage
        src={clerkUser?.imageUrl}
        alt={clerkUser?.fullName || "User"}
      />
      <AvatarFallback className="text-sm">
        {clerkUser?.firstName?.charAt(0) || "U"}
        {clerkUser?.lastName?.charAt(0) || ""}
      </AvatarFallback>
    </Avatar>
  );
};

const UserDropDownMenuContent = ({
  isFullyReady,
  isAnonymous,
  clerkUser,
}: {
  isFullyReady: boolean;
  isAnonymous: boolean;
  clerkUser: ClerkUser;
}) => {
  const { signOut } = useAuthActions();
  const { setOpenMobile } = useSidebar();
  const { openUserProfile } = useClerk();

  if (!isFullyReady || isAnonymous) {
    return null;
  }

  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">
            {clerkUser?.fullName || clerkUser?.firstName || "User"}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
            {clerkUser?.emailAddresses[0]?.emailAddress}
          </p>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuGroup>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            setOpenMobile(false);
            openUserProfile();
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuItem
        className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        onClick={() =>
          signOut(undefined, {
            redirectUrl: "/chat",
          })
        }
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );
};

const UserInfos = ({
  isLoading,
  isAnonymous,
  clerkUser,
}: {
  isLoading: boolean;
  isAnonymous: boolean;
  clerkUser: ClerkUser;
}) => {
  const { data: convexUser, isStale } = useColdCachedQuery(
    api.users.getCurrentUser
  );
  const isConvexUserLoading = convexUser === undefined;

  return (
    <div className="flex flex-col items-start min-w-0">
      {isLoading ? (
        <Skeleton className="h-4 w-24 rounded-full mb-1" />
      ) : isAnonymous ? (
        <span className="text-sm font-medium truncate max-w-32">Anonymous</span>
      ) : (
        <span className="text-sm font-medium truncate max-w-32">
          {clerkUser?.fullName || clerkUser?.firstName || "User"}
        </span>
      )}

      {isAnonymous ? (
        <span className="text-xs text-muted-foreground truncate max-w-32">
          {"---"}
        </span>
      ) : isLoading || isConvexUserLoading ? (
        <Skeleton className="h-3 w-16 rounded-full" />
      ) : (
        <span
          className={cn(
            "text-xs text-muted-foreground truncate max-w-32",
            isStale && "text-muted"
          )}
        >
          {convexUser?.tier
            ? convexUser.tier === "free"
              ? "Free"
              : "Premium"
            : "Free"}
        </span>
      )}
    </div>
  );
};
