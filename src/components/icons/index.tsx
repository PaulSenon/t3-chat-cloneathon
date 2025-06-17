import React, { forwardRef } from "react";
import { OpenAIIcon } from "./openai";
import { AnthropicIcon } from "./anthropic";
import { GeminiIcon } from "./gemini";

// Export individual icons
export { OpenAIIcon, AnthropicIcon, GeminiIcon };

// Icon mapping and types
const iconMap = {
  openai: OpenAIIcon,
  anthropic: AnthropicIcon,
  gemini: GeminiIcon,
} as const;

export type CustomIconId = keyof typeof iconMap;

interface DynamicCustomIconProps extends React.SVGProps<SVGSVGElement> {
  icon: CustomIconId;
  size?: number | string;
}

export const DynamicCustomIcon = forwardRef<
  SVGSVGElement,
  DynamicCustomIconProps
>(({ icon, ...props }, ref) => {
  const IconComponent = iconMap[icon];
  return <IconComponent ref={ref} {...props} />;
});

DynamicCustomIcon.displayName = "DynamicCustomIcon";
