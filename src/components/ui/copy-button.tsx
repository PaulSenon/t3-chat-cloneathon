"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Button variant (defaults to "ghost") */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  /** Button size (defaults to "sm") */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional CSS classes */
  className?: string;
  /** Custom aria-label (defaults to "Copy to clipboard") */
  "aria-label"?: string;
  /** Custom success message duration in ms (defaults to 2000) */
  successDuration?: number;
  /** Show text label alongside icon */
  showLabel?: boolean;
  /** Custom success callback */
  onCopySuccess?: () => void;
  /** Custom error callback */
  onCopyError?: (error: Error) => void;
}

/**
 * Reusable copy button with smooth animation between copy and check states
 */
export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      text,
      variant = "ghost",
      size = "sm",
      className,
      "aria-label": ariaLabel = "Copy to clipboard",
      successDuration = 2000,
      showLabel = false,
      onCopySuccess,
      onCopyError,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopySuccess?.();
        setTimeout(() => setCopied(false), successDuration);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        onCopyError?.(error as Error);
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "transition-all duration-200",
          showLabel ? "gap-2" : "p-0",
          size === "sm" && !showLabel && "h-8 w-8 rounded-lg",
          className
        )}
        onClick={handleCopy}
        aria-label={copied ? "Copied!" : ariaLabel}
        disabled={copied}
        {...props}
      >
        <div className="relative size-4">
          <Copy
            className={cn(
              "absolute inset-0 transition-all duration-200 ease-out",
              copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}
          />
          <Check
            className={cn(
              "absolute inset-0 transition-all duration-200 ease-out",
              copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
          />
        </div>
        {showLabel && (
          <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
        )}
      </Button>
    );
  }
);

CopyButton.displayName = "CopyButton";
