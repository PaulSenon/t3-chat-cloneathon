import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// SOURCE: COPIED FROM https://t3.chat/ without modification
export const AnthropicIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 16, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 46 32"
      fill="currentColor"
      className={cn("shrink-0", className)}
      {...props}
    >
      <title>Anthropic</title>
      <path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264Zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668Z" />
    </svg>
  )
);

AnthropicIcon.displayName = "AnthropicIcon";
