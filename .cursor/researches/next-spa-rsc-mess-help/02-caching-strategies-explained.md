# Caching Strategies for Chat SPA

## Why Not SWR for This Use Case?

You asked a great question about SWR. Let's analyze why it doesn't fit perfectly here:

### SWR Pattern

```typescript
// SWR: Good for standard data fetching
const { data: threads } = useSWR("/api/threads", fetcher);
```

**SWR Issues for Chat:**

1. **Not Reactive**: SWR fetches once, Convex is real-time reactive
2. **No Optimistic Updates**: SWR doesn't handle optimistic message creation well
3. **Complex Thread Switching**: SWR doesn't handle our specific navigation patterns

### Convex's Built-in Reactivity

```typescript
// Convex: Already reactive and cached
const threads = useQuery(api.chat.getUserThreads, {
  paginationOpts: { numItems: 50 },
});
```

**Why Convex is Better:**

- ✅ **Real-time**: Automatic updates when data changes
- ✅ **Built-in Cache**: Convex already caches queries
- ✅ **Optimistic**: Built-in optimistic update support
- ✅ **Offline**: Built-in offline/online handling

## The Right Caching Strategy

### 1. **Convex as Primary Cache**

```typescript
// Convex handles the reactive caching
const threads = useQuery(api.chat.getUserThreads, {
  paginationOpts: { numItems: 50 },
});

// Convex automatically:
// - Caches results
// - Updates on changes
// - Handles subscriptions
// - Manages offline state
```

### 2. **LocalStorage for Persistence**

```typescript
// Only use localStorage for:
// 1. Recently viewed threads (for instant access)
// 2. Draft messages
// 3. UI preferences

const useRecentThreads = () => {
  const [recent, setRecent] = useState(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("recent-threads");
    return stored ? JSON.parse(stored) : [];
  });

  const addRecentThread = useCallback((thread) => {
    setRecent((prev) => {
      const updated = [thread, ...prev.filter((t) => t.id !== thread.id)].slice(
        0,
        10
      );
      localStorage.setItem("recent-threads", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recent, addRecentThread };
};
```

### 3. **Thread Navigation Cache**

This is where custom caching makes sense:

```typescript
// Custom hook for instant thread navigation
const useThreadNavigation = () => {
  const router = useRouter();
  const { addRecentThread } = useRecentThreads();

  // Pre-cache thread messages for instant loading
  const navigateToThread = useCallback(
    async (thread) => {
      // 1. Add to recent threads (localStorage)
      addRecentThread(thread);

      // 2. Navigate instantly (no server round-trip)
      router.push(`/chat/${thread.uuid}`);

      // 3. Convex will handle the data loading reactively
    },
    [router, addRecentThread]
  );

  return { navigateToThread };
};
```

## Complete Cache Provider Example

Here's a properly integrated cache provider that addresses your concerns:

```typescript
// providers/ChatCacheProvider.tsx
'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ChatCacheContextType {
  // Thread management
  threads: any[] | undefined;
  currentThreadId: string | null;
  setCurrentThreadId: (id: string | null) => void;

  // Navigation
  navigateToThread: (threadId: string) => void;

  // Recent threads (localStorage)
  recentThreads: any[];
  addRecentThread: (thread: any) => void;

  // Loading states
  isLoadingThreads: boolean;
}

const ChatCacheContext = createContext<ChatCacheContextType | null>(null);

export function ChatCacheProvider({ children }: { children: React.ReactNode }) {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);

  // Load recent threads from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('recent-threads');
    if (stored) {
      setRecentThreads(JSON.parse(stored));
    }
  }, []);

  // Convex reactive query for all threads
  const threads = useQuery(api.chat.getUserThreads, {
    paginationOpts: { numItems: 50 }
  });

  const addRecentThread = useCallback((thread: any) => {
    setRecentThreads(prev => {
      const updated = [thread, ...prev.filter(t => t.uuid !== thread.uuid)].slice(0, 10);
      localStorage.setItem('recent-threads', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const navigateToThread = useCallback((threadId: string) => {
    // Find thread in Convex data or recent threads
    const thread = threads?.results?.find(t => t.uuid === threadId) ||
                   recentThreads.find(t => t.uuid === threadId);

    if (thread) {
      addRecentThread(thread);
    }

    setCurrentThreadId(threadId);
    // Note: URL update happens in the component that calls this
  }, [threads, recentThreads, addRecentThread]);

  return (
    <ChatCacheContext.Provider value={{
      threads: threads?.results,
      currentThreadId,
      setCurrentThreadId,
      navigateToThread,
      recentThreads,
      addRecentThread,
      isLoadingThreads: threads === undefined,
    }}>
      {children}
    </ChatCacheContext.Provider>
  );
}

export const useChatCache = () => {
  const context = useContext(ChatCacheContext);
  if (!context) {
    throw new Error('useChatCache must be used within ChatCacheProvider');
  }
  return context;
};
```

## How This Integrates with Your Current Code

### 1. **Replace Your Current Navigation**

```typescript
// OLD: Server-side redirect
// app/chat/page.tsx
export default async function ChatPage() {
  const id = crypto.randomUUID();
  redirect(`/chat/${id}`); // ❌ Server round-trip
}

// NEW: Client-side navigation
// app/chat/[[...id]]/page.tsx
'use client'
export default function ChatPage() {
  const params = useParams();
  const { setCurrentThreadId } = useChatCache();
  const router = useRouter();

  useEffect(() => {
    const threadId = params.id?.[0];
    if (!threadId) {
      // Create new thread client-side
      const newId = crypto.randomUUID();
      router.replace(`/chat/${newId}`);
      setCurrentThreadId(newId);
    } else {
      setCurrentThreadId(threadId);
    }
  }, [params.id, setCurrentThreadId, router]);

  return <Chat />;
}
```

### 2. **Update Your Sidebar**

```typescript
// components/chat/chat-sidebar.tsx
'use client'
export function ChatSidebar() {
  const { threads, navigateToThread, recentThreads, isLoadingThreads } = useChatCache();
  const router = useRouter();

  const handleThreadClick = (thread: any) => {
    navigateToThread(thread.uuid);
    router.push(`/chat/${thread.uuid}`); // Update URL
  };

  if (isLoadingThreads) {
    return <SidebarSkeleton />;
  }

  return (
    <div>
      {/* Recent threads for instant access */}
      {recentThreads.length > 0 && (
        <section>
          <h3>Recent</h3>
          {recentThreads.slice(0, 5).map(thread => (
            <ThreadItem
              key={thread.uuid}
              thread={thread}
              onClick={() => handleThreadClick(thread)}
            />
          ))}
        </section>
      )}

      {/* All threads from Convex */}
      <section>
        <h3>All Conversations</h3>
        {threads?.map(thread => (
          <ThreadItem
            key={thread.uuid}
            thread={thread}
            onClick={() => handleThreadClick(thread)}
          />
        ))}
      </section>
    </div>
  );
}
```

## Why This Approach Works

1. **Convex Handles Reactivity**: No need for SWR when Convex is already reactive
2. **LocalStorage for Speed**: Only for recently viewed threads, not all data
3. **Client-Side Navigation**: No server round-trips for thread switching
4. **Integrated Cache**: Single source of truth with proper state management

This gives you the SPA experience you want while leveraging Convex's strengths.
