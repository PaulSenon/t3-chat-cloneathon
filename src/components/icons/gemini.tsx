import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// SOURCE: COPIED FROM https://t3.chat/ without modification
export const GeminiIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 16, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("shrink-0", className)}
      {...props}
    >
      <title>Gemini</title>
      <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" />
    </svg>
  )
);

GeminiIcon.displayName = "GeminiIcon";
