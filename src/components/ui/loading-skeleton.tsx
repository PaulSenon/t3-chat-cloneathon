import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
        className
      )}
      {...props}
    />
  );
}

// Chat message skeleton to prevent CLS
export function ChatMessageSkeleton() {
  return (
    <div className="flex items-start space-x-3 p-4 animate-pulse">
      {/* Avatar skeleton */}
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full flex-shrink-0" />
      
      {/* Message content skeleton */}
      <div className="flex-1 space-y-2">
        {/* First line - longer */}
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        {/* Second line - medium */}
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        {/* Third line - shorter */}
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
      </div>
    </div>
  );
}

// Streaming message skeleton with typing animation
export function StreamingMessageSkeleton() {
  return (
    <div className="flex items-start space-x-3 p-4">
      {/* Avatar */}
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full flex-shrink-0" />
      
      {/* Typing indicator */}
      <div className="flex-1">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

// Chat list skeleton
export function ChatListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Sidebar skeleton
export function SidebarSkeleton() {
  return (
    <div className="w-64 border-r bg-white dark:bg-gray-900 animate-pulse">
      <div className="p-4 border-b">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="flex h-screen">
      <SidebarSkeleton />
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="border-b p-4 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-48" />
        </div>
        
        {/* Messages area skeleton */}
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <ChatMessageSkeleton key={i} />
          ))}
        </div>
        
        {/* Input area skeleton */}
        <div className="border-t p-4 animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Performance-optimized skeleton with reduced repaints
export function OptimizedSkeleton({ 
  lines = 3, 
  className = "" 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => {
        // Vary line widths to look realistic but keep consistent to prevent CLS
        const widths = ['w-full', 'w-3/4', 'w-1/2', 'w-2/3'];
        const width = widths[i % widths.length];
        
        return (
          <div
            key={i}
            className={cn(
              "h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse",
              width
            )}
            style={{
              // Use transform for animations to avoid layout recalculations
              animationDelay: `${i * 0.1}s`
            }}
          />
        );
      })}
    </div>
  );
}