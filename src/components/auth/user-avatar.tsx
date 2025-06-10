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

interface UserProfileButtonProps {
  className?: string;
}

export function UserProfileButton({ className }: UserProfileButtonProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) {
    return null;
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
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
            <AvatarFallback className="text-sm">
              {user.firstName?.charAt(0) || "U"}
              {user.lastName?.charAt(0) || ""}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate max-w-32">
              {user.fullName || user.firstName || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-32">
              {/* TODO subscription tier */}
              Free
            </span>
          </div>

          <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.fullName || user.firstName || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
