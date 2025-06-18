"use client";

import React, { memo, useState } from "react";
import ReactMarkdown, { ExtraProps, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Code, CodeIcon, Copy, ExternalLink, WrapText } from "lucide-react";
import { Button } from "./button";
import { CopyButton } from "./copy-button";

interface CodeBlockProps extends ExtraProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Simple code block component - no highlighting, just monospace + scrollable
 */
export function CodeBlock({
  node,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [wrap, setWrap] = useState(false);
  // Fenced code blocks will have a className like "language-js"
  const match = /language-(\w+)/.exec(className || "");

  // Heuristic to check if it's a block:
  // 1. It has a language className.
  // 2. It contains a newline.
  // This is more reliable than the `inline` prop.
  const isBlock = match || String(children).includes("\n");
  console.log("CODE NODE", children);

  if (isBlock) {
    // Block code - with a header for visual separation
    return (
      <div className="not-prose group flex flex-col my-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between bg-muted/50 px-2 py-1.5 border border-border/50 rounded-t-md sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2 pl-2 text-muted-foreground">
            <Code className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Code</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWrap(!wrap)}
              className={cn(
                "text-muted-foreground transition-all duration-200",
                wrap && "text-primary"
              )}
            >
              <WrapText className="w-4 h-4" />
            </Button>
            <CopyButton
              text={children?.toString() || ""}
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            />
          </div>
        </div>

        {/* Code block */}
        <pre
          {...props}
          className="text-sm w-full overflow-x-auto bg-muted/30 p-4 border-x border-b border-border/50 rounded-b-md dark:text-foreground text-foreground font-mono"
        >
          <code className={cn(wrap && "whitespace-pre-wrap break-words")}>
            {children}
          </code>
        </pre>
      </div>
    );
  } else {
    // Inline code
    return (
      <code
        className={cn(
          "bg-muted px-[0.3rem] py-[0.2rem] rounded-md font-mono inline"
        )}
        {...props}
      >
        {children}
      </code>
    );
  }
}

export const Link = ({
  children,
  href,
  ...props
}: {
  children: React.ReactNode;
  href: string;
}) => {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  return (
    <a
      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
      href={href}
      target={isInternal ? undefined : "_blank"}
      rel={isInternal ? undefined : "noopener noreferrer"}
      {...props}
    >
      {children}
      {!isInternal && <ExternalLink className="w-4 h-4 inline-block ml-1" />}
    </a>
  );
};

/**
 * Optimized markdown components configuration
 */
const components: Partial<Components> = {
  // Code handling - properly typed
  code: ({ className, children, ...props }) => (
    <CodeBlock className={className} {...props}>
      {children}
    </CodeBlock>
  ),
  pre: ({ children }) => <>{children}</>,

  // Typography
  h1: ({ children, ...props }) => (
    <h1 className="text-4xl font-semibold mt-6 mb-3 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-3xl font-semibold mt-5 mb-2 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-2xl font-semibold mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-xl font-semibold mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="text-lg font-semibold mt-3 mb-2 first:mt-0" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="text-base font-semibold mt-3 mb-2 first:mt-0" {...props}>
      {children}
    </h6>
  ),

  // Lists
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside ml-6 space-y-1 my-4" {...props}>
      {children}
    </ol>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside ml-6 space-y-1 my-4" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Text formatting
  p: ({ children, ...props }) => (
    <p className="leading-relaxed mb-3 last:mb-0" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Links
  a: ({ children, href, ...props }) => (
    <Link href={href || ""} {...props}>
      {children}
    </Link>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }) => (
    <div className="not-prose my-4">
      <blockquote
        className="border-l-2 border-border/50 pl-4 py-2 bg-muted/30 italic text-muted-foreground"
        {...props}
      >
        {children}
      </blockquote>
    </div>
  ),

  // Tables
  table: ({ children, ...props }) => (
    <div className="not-prose overflow-x-auto my-4">
      <table
        className="w-full border-collapse border border-border/50"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border/50" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="text-left p-2 font-semibold text-sm" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="p-2 text-sm" {...props}>
      {children}
    </td>
  ),

  // Horizontal rule
  hr: ({ ...props }) => (
    <hr className="my-6 border-t border-border/50" {...props} />
  ),
};

/**
 * Main markdown component optimized for streaming chat messages
 * Uses React.memo with content comparison to prevent unnecessary re-renders
 */
export const Markdown = memo(
  ({ children }: { children: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: true }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if content actually changed
    return prevProps.children === nextProps.children;
  }
);

Markdown.displayName = "Markdown";

export default Markdown;
