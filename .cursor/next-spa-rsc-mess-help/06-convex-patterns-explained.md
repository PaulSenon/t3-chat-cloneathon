# Convex Patterns Explained

## The "convexQuery" Pattern Mystery

You mentioned not understanding the `convexQuery` pattern from my earlier examples. Let me clarify - this was actually a **confusing pattern I shouldn't have suggested**.

### What I Showed (Confusing ❌)

```typescript
// This was unnecessarily complex
export function convexQuery(query, args) {
  return {
    queryKey: [query._name, args],
    queryFn: () => convex.query(query, args),
    staleTime: 5 * 60 * 1000,
  };
}

// Then using with React Query
const { data: threads } = useQuery(convexQuery(api.threads.list, {}));
```

**Why This is Bad:**

- ❌ Adds unnecessary complexity
- ❌ Duplicates Convex's built-in caching
- ❌ Loses Convex's real-time reactivity
- ❌ React Query and Convex don't play well together

### What You Should Use (Simple ✅)

```typescript
// Just use Convex directly - it's already reactive and cached
const threads = useQuery(api.chat.getUserThreads, {
  paginationOpts: { numItems: 50 },
});
```

**Why This is Better:**

- ✅ Simple and direct
- ✅ Built-in reactivity
- ✅ Automatic caching
- ✅ Real-time updates
- ✅ Offline support

## Proper Convex Patterns for Your Chat App

### 1. **Basic Reactive Queries**

```typescript
// components/chat/chat-sidebar.tsx
'use client'
export function ChatSidebar() {
  // This automatically:
  // - Caches the result
  // - Re-runs when data changes
  // - Handles loading/error states
  // - Updates in real-time
  const threadsResult = useQuery(api.chat.getUserThreads, {
    paginationOpts: { numItems: 50 }
  });

  if (threadsResult === undefined) {
    return <SidebarSkeleton />;
  }

  const threads = threadsResult.results;

  return (
    <div>
      {threads.map(thread => (
        <ThreadItem key={thread._id} thread={thread} />
      ))}
    </div>
  );
}
```

### 2. **Conditional Queries (Skip Pattern)**

```typescript
// components/chat/chat-messages.tsx
export function ChatMessages() {
  const { currentThreadId } = useChatCache();

  // Skip the query if no thread selected
  const thread = useQuery(
    api.chat.getChat,
    currentThreadId ? { uuid: currentThreadId } : 'skip'
  );

  // Convex returns undefined while loading, null if not found
  if (thread === undefined) return <LoadingSpinner />;
  if (thread === null) return <ThreadNotFound />;

  return <div>{/* Render thread */}</div>;
}
```

### 3. **Mutations with Optimistic Updates**

```typescript
// hooks/useChatMutations.tsx
export function useChatMutations() {
  const createThread = useMutation(api.chat.createChat);
  const saveThread = useMutation(api.chat.saveChat);

  const createNewThread = useCallback(
    async (message: string) => {
      const threadId = crypto.randomUUID();

      try {
        const thread = await createThread({
          uuid: threadId,
          messages: JSON.stringify([
            {
              id: crypto.randomUUID(),
              role: "user",
              content: message,
            },
          ]),
        });

        return thread;
      } catch (error) {
        console.error("Failed to create thread:", error);
        throw error;
      }
    },
    [createThread]
  );

  return {
    createNewThread,
    saveThread,
  };
}
```

### 4. **Server-Side Data Fetching (SSR/RSC)**

```typescript
// app/chat/[[...id]]/page.tsx
import { api } from '@/convex/_generated/api';
import { preloadQuery } from 'convex/nextjs';
import { ChatMessagesClient } from '@/components/chat/chat-messages-client';

export default async function ChatPage({
  params,
}: {
  params: { id?: string[] };
}) {
  const threadId = params.id?.[0];

  // Preload on server, pass promise to client
  const threadPromise = threadId
    ? preloadQuery(api.chat.getChat, { uuid: threadId })
    : null;

  return (
    <ChatMessagesClient
      threadId={threadId}
      threadPromise={threadPromise}
    />
  );
}
```

```typescript
// components/chat/chat-messages-client.tsx
"use client";
import { usePreloadedQuery } from "convex/react";

export function ChatMessagesClient({
  threadId,
  threadPromise,
}: {
  threadId?: string;
  threadPromise?: any;
}) {
  // Use preloaded data if available, otherwise regular query
  const thread = threadPromise
    ? usePreloadedQuery(threadPromise)
    : useQuery(api.chat.getChat, threadId ? { uuid: threadId } : "skip");

  // Rest of component...
}
```

## Advanced Convex Patterns

### 1. **Pagination with Infinite Loading**

```typescript
// hooks/useInfiniteThreads.tsx
export function useInfiniteThreads() {
  const [allThreads, setAllThreads] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const threadsResult = useQuery(api.chat.getUserThreads, {
    paginationOpts: {
      numItems: 20,
      cursor: cursor || undefined,
    },
  });

  useEffect(() => {
    if (threadsResult) {
      setAllThreads((prev) => {
        if (cursor === null) {
          // First load
          return threadsResult.results;
        } else {
          // Append to existing
          return [...prev, ...threadsResult.results];
        }
      });

      setHasMore(threadsResult.hasMore);
    }
  }, [threadsResult, cursor]);

  const loadMore = useCallback(() => {
    if (threadsResult?.hasMore) {
      setCursor(threadsResult.continueCursor);
    }
  }, [threadsResult]);

  return {
    threads: allThreads,
    hasMore,
    loadMore,
    isLoading: threadsResult === undefined,
  };
}
```

### 2. **Real-time Subscriptions**

```typescript
// Convex automatically handles real-time updates
// Just use useQuery and it updates when data changes

// components/chat/real-time-thread-list.tsx
export function RealTimeThreadList() {
  const threads = useQuery(api.chat.getUserThreads, {
    paginationOpts: { numItems: 50 }
  });

  // This automatically re-renders when:
  // - New threads are created
  // - Thread titles change
  // - Threads are deleted
  // - Messages are added (if metadata includes last message)

  return (
    <div>
      {threads?.results.map(thread => (
        <div key={thread._id}>
          <h3>{thread.title}</h3>
          <p>Updated: {new Date(thread.updatedAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. **Error Handling Patterns**

```typescript
// hooks/useConvexWithErrorHandling.tsx
export function useConvexWithErrorHandling() {
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  const safeQuery = useCallback((api: any, args: any, errorKey: string) => {
    try {
      const result = useQuery(api, args);

      // Clear error if query succeeds
      if (result !== undefined) {
        setErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(errorKey);
          return newErrors;
        });
      }

      return result;
    } catch (error) {
      setErrors((prev) => new Map(prev).set(errorKey, error as Error));
      return null;
    }
  }, []);

  const safeMutation = useCallback(
    async (mutation: any, args: any, errorKey: string) => {
      try {
        const result = await mutation(args);

        // Clear error on success
        setErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(errorKey);
          return newErrors;
        });

        return result;
      } catch (error) {
        setErrors((prev) => new Map(prev).set(errorKey, error as Error));
        throw error;
      }
    },
    []
  );

  return {
    errors,
    safeQuery,
    safeMutation,
    clearError: (key: string) =>
      setErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(key);
        return newErrors;
      }),
  };
}
```

### 4. **Optimized Query Patterns**

```typescript
// Batch multiple queries efficiently
export function useChatData(threadId?: string) {
  // All these run in parallel and are cached independently
  const threads = useQuery(api.chat.getUserThreads, {
    paginationOpts: { numItems: 20 },
  });

  const currentThread = useQuery(
    api.chat.getChat,
    threadId ? { uuid: threadId } : "skip"
  );

  const user = useQuery(api.users.getCurrentUser, {});

  return {
    threads: threads?.results,
    currentThread,
    user,
    isLoading:
      threads === undefined ||
      currentThread === undefined ||
      user === undefined,
  };
}
```

## Why Convex Patterns are Better Than React Query

### Built-in Benefits

1. **Real-time**: Automatic updates when backend data changes
2. **Caching**: Smart caching based on function name + arguments
3. **Optimistic Updates**: Built-in support with automatic rollback
4. **Offline**: Handles offline/online seamlessly
5. **Type Safety**: Full TypeScript integration
6. **Developer Experience**: Excellent debugging and dev tools

### Your Current RLS Integration

```typescript
// Your RLS system already gives you:
export const getUserThreads = queryWithRLS({
  handler: async (ctx) => {
    // Automatically filtered to current user
    return await ctx.db.query("threads").collect();
  },
});

// Usage is simple:
const threads = useQuery(api.chat.getUserThreads, {});
// ✅ Secure: Only shows user's threads
// ✅ Reactive: Updates when threads change
// ✅ Cached: Doesn't refetch unnecessarily
```

## Key Takeaways

1. **Keep it Simple**: Use Convex's `useQuery` and `useMutation` directly
2. **Trust the System**: Convex handles caching, reactivity, and optimization
3. **Leverage RLS**: Your security layer is already perfect
4. **Use Preloading**: For SSR, use `preloadQuery` → `usePreloadedQuery`
5. **Handle Loading States**: Check for `undefined` (loading) vs `null` (not found)

The `convexQuery` pattern I mentioned earlier was overengineering. Convex is already optimized for exactly your use case!
