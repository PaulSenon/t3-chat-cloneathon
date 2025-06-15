# Navigation and Preloading Strategies

## Next.js Link Preloading vs Custom Implementation

You're absolutely right about Next.js Link preloading! Let me clarify when to use built-in features vs custom implementations.

### Next.js Built-in Preloading

Next.js `Link` components automatically prefetch pages on hover:

```typescript
// Next.js automatically prefetches the page component
<Link href={`/chat/${thread.uuid}`}>
  {thread.title}
</Link>
```

**What Next.js prefetches:**

- ✅ **Page Components**: JavaScript bundles for the route
- ✅ **Server Components**: RSC payload if SSR is enabled
- ❌ **Data Queries**: Doesn't prefetch Convex queries
- ❌ **Client State**: Doesn't prepare client-side cache

### Why Custom Preloading Still Matters

For a chat SPA, we need more than just component prefetching:

```typescript
// What we ACTUALLY need to preload for instant chat experience:
const handleThreadHover = (threadId: string) => {
  // 1. Page component (Next.js handles this automatically)
  // 2. Thread messages (we need custom logic)
  // 3. Update recent threads cache
  // 4. Prepare optimistic state
};
```

## The Right Navigation Strategy

### 1. **Use Next.js Link for Basic Navigation**

```typescript
// components/ThreadItem.tsx
import Link from 'next/link';
import { useChatCache } from '@/providers/ChatCacheProvider';

export function ThreadItem({ thread }: { thread: any }) {
  const { navigateToThread } = useChatCache();

  const handleClick = (e: React.MouseEvent) => {
    // Don't prevent default - let Next.js handle routing
    // But update our cache state
    navigateToThread(thread.uuid);
  };

  const handleMouseEnter = () => {
    // Custom preloading: prepare thread data
    navigateToThread(thread.uuid); // Updates cache without navigation
  };

  return (
    <Link
      href={`/chat/${thread.uuid}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className="thread-item"
    >
      <div className="thread-title">{thread.title}</div>
      <div className="thread-preview">{thread.lastMessage}</div>
    </Link>
  );
}
```

### 2. **Disable Prefetching When It Interferes**

For SPA behavior, sometimes we want to disable Next.js prefetching:

```typescript
// When you want pure client-side navigation
<Link
  href={`/chat/${thread.uuid}`}
  prefetch={false} // Disable Next.js prefetching
  onClick={handleClientSideNavigation}
>
  {thread.title}
</Link>
```

### 3. **Hybrid Approach: Best of Both Worlds**

```typescript
// Smart navigation that adapts to the situation
export function SmartThreadLink({ thread }: { thread: any }) {
  const router = useRouter();
  const { currentThreadId, navigateToThread } = useChatCache();
  const [isClientNavigation, setIsClientNavigation] = useState(false);

  useEffect(() => {
    // After first load, switch to client-side navigation
    setIsClientNavigation(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (isClientNavigation && currentThreadId) {
      // Pure client-side navigation for SPA experience
      e.preventDefault();
      navigateToThread(thread.uuid);
      router.push(`/chat/${thread.uuid}`);
    }
    // Otherwise, let Next.js handle it (first load)
  };

  return (
    <Link
      href={`/chat/${thread.uuid}`}
      prefetch={isClientNavigation ? false : undefined}
      onClick={handleClick}
      onMouseEnter={() => navigateToThread(thread.uuid)}
    >
      {thread.title}
    </Link>
  );
}
```

## Data Preloading Strategy

### 1. **Convex Query Preloading**

Unlike page prefetching, we need custom logic for data:

```typescript
// hooks/useThreadPreloading.ts
import { useQuery, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useThreadPreloading() {
  const [preloadedThreads, setPreloadedThreads] = useState(new Map());

  const preloadThread = useCallback(
    (threadId: string) => {
      if (!preloadedThreads.has(threadId)) {
        // Start loading thread messages
        const threadQuery = useQuery(api.chat.getChat, { uuid: threadId });
        setPreloadedThreads((prev) => new Map(prev).set(threadId, threadQuery));
      }
    },
    [preloadedThreads]
  );

  const getPreloadedThread = useCallback(
    (threadId: string) => {
      return preloadedThreads.get(threadId);
    },
    [preloadedThreads]
  );

  return { preloadThread, getPreloadedThread };
}
```

### 2. **Smart Preloading with Intersection Observer**

```typescript
// components/ThreadList.tsx
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export function ThreadList({ threads }: { threads: any[] }) {
  const { preloadThread } = useThreadPreloading();

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const threadId = entry.target.getAttribute('data-thread-id');
        if (threadId) {
          preloadThread(threadId);
        }
      }
    });
  }, [preloadThread]);

  const { ref } = useIntersectionObserver({
    onIntersect: handleIntersection,
    threshold: 0.1,
  });

  return (
    <div ref={ref}>
      {threads.map(thread => (
        <div
          key={thread.uuid}
          data-thread-id={thread.uuid}
        >
          <ThreadItem thread={thread} />
        </div>
      ))}
    </div>
  );
}
```

## Navigation Performance Optimization

### 1. **Prefetch on Hover (Most Common)**

```typescript
// 200ms delay to avoid excessive prefetching
const useDebouncedHover = (callback: () => void, delay = 200) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((e: React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);
};

export function ThreadItem({ thread }: { thread: any }) {
  const { preloadThread } = useThreadPreloading();

  const handleHover = useDebouncedHover(() => {
    preloadThread(thread.uuid);
  }, 200);

  return (
    <Link href={`/chat/${thread.uuid}`} onMouseEnter={handleHover}>
      {thread.title}
    </Link>
  );
}
```

### 2. **Prefetch on Intent (Touch/Mobile)**

```typescript
// For mobile: prefetch on touch start
export function ThreadItemMobile({ thread }: { thread: any }) {
  const { preloadThread } = useThreadPreloading();

  const handleTouchStart = useCallback(() => {
    preloadThread(thread.uuid);
  }, [thread.uuid, preloadThread]);

  return (
    <Link
      href={`/chat/${thread.uuid}`}
      onTouchStart={handleTouchStart}
    >
      {thread.title}
    </Link>
  );
}
```

## Complete Navigation Hook

```typescript
// hooks/useChatNavigation.ts
export function useChatNavigation() {
  const router = useRouter();
  const { currentThreadId, setCurrentThreadId, addRecentThread } =
    useChatCache();
  const { preloadThread } = useThreadPreloading();

  // Navigate to thread with full preloading
  const navigateToThread = useCallback(
    (thread: any) => {
      // 1. Preload thread data
      preloadThread(thread.uuid);

      // 2. Update recent threads
      addRecentThread(thread);

      // 3. Update current thread state
      setCurrentThreadId(thread.uuid);

      // 4. Update URL (client-side routing)
      router.push(`/chat/${thread.uuid}`);
    },
    [router, preloadThread, addRecentThread, setCurrentThreadId]
  );

  // Create new thread
  const createNewThread = useCallback(() => {
    const newId = crypto.randomUUID();
    setCurrentThreadId(newId);
    router.push(`/chat/${newId}`);
  }, [router, setCurrentThreadId]);

  return {
    navigateToThread,
    createNewThread,
    currentThreadId,
  };
}
```

## When to Use What

| Use Case                  | Method                 | Reason                               |
| ------------------------- | ---------------------- | ------------------------------------ |
| **First page load**       | Next.js Link (default) | SSR benefits + automatic prefetching |
| **Subsequent navigation** | Custom client-side     | SPA experience + data preloading     |
| **Hover intent**          | Custom preloading      | Prepare data, not just components    |
| **Mobile touch**          | Touch start preloading | No hover events on mobile            |
| **Large thread lists**    | Intersection Observer  | Performance + selective loading      |

This approach gives you the benefits of Next.js prefetching while adding the custom data preloading needed for a true SPA chat experience.
