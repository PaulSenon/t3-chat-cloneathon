"use client";

import { useUser, useClerk } from "@clerk/nextjs";
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
import { useAuth } from "@/hooks/useAuth";

interface UserProfileButtonProps {
  className?: string;
}

export function UserProfileButton({ className }: UserProfileButtonProps) {
  const { clerkUser, signOut, isUserLoaded, isUserSignedIn } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-3 p-2 h-auto hover:bg-accent hover:border data-[state=open]:bg-accent data-[state=open]:border",
            className
          )}
          disabled={!isUserLoaded || !isUserSignedIn}
        >
          {isUserLoaded && isUserSignedIn ? (
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
          ) : (
            <Skeleton className="h-8 w-8 rounded-full" />
          )}

          <div className="flex flex-col items-start min-w-0">
            {isUserLoaded && isUserSignedIn ? (
              <span className="text-sm font-medium truncate max-w-32">
                {clerkUser?.fullName || clerkUser?.firstName || "User"}
              </span>
            ) : (
              <Skeleton className="h-4 w-24 rounded-full mb-1" />
            )}
            {isUserLoaded && isUserSignedIn ? (
              <span className="text-xs text-muted-foreground truncate max-w-32">
                {/* TODO subscription tier */}
                Free
              </span>
            ) : (
              <Skeleton className="h-3 w-16 rounded-full" />
            )}
          </div>

          <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 bg-background/50 backdrop-blur-md"
        align="start"
        forceMount
      >
        {isUserLoaded && isUserSignedIn && (
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
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
