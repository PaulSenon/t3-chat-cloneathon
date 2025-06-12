# Next.js SPA with RSC, Streaming, and Convex - A Comprehensive Guide

This guide addresses the complexities of building a performant SPA chat application using Next.js App Router, React Server Components (RSC), streaming, and Convex reactive data fetching.

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Mental Model & Architecture](#mental-model--architecture) 
3. [Key Technologies](#key-technologies)
4. [Proposed Solutions](#proposed-solutions)
5. [Implementation Patterns](#implementation-patterns)
6. [Navigation Strategies](#navigation-strategies)
7. [Data Fetching & Caching](#data-fetching--caching)
8. [Troubleshooting Guide](#troubleshooting-guide)

## Problem Analysis

### Your Core Requirements
- **Routes**: `/chat` (new) and `/chat/{id}` (existing chat)
- **Layout**: Consistent sidebar with all threads + chat area
- **Behavior**: Pure SPA experience with instant navigation
- **Data**: Convex with reactive `useQuery`
- **Performance**: Instant interactivity, especially chat input
- **Optimization**: Cache threads for fastest possible UX

### Key Challenges
1. **SSR vs SPA**: How to get fast initial load but pure client navigation afterward
2. **Data Consistency**: Server-prefetched data vs reactive Convex queries
3. **Navigation**: Avoiding SSR/RSC on subsequent navigations
4. **State Management**: Shared thread cache across components
5. **Hydration**: Preventing mismatches between server/client

## Mental Model & Architecture

### The Hybrid Approach

```
┌─ Initial Page Load (SSR) ─┐    ┌─ Subsequent Navigation (SPA) ─┐
│                           │    │                               │
│ 1. Server renders shell   │    │ 1. Client-side routing        │
│ 2. Stream sidebar data    │    │ 2. Instant navigation         │
│ 3. Pass promises to client│    │ 3. Data from shared cache     │
│ 4. Hydrate with Convex    │    │ 4. Reactive updates continue  │
│                           │    │                               │
└───────────────────────────┘    └───────────────────────────────┘
```

### Component Architecture

```
app/layout.tsx (RSC)
├── ConvexProvider (Client)
├── ThreadCacheProvider (Client) 
└── app/chat/layout.tsx (RSC)
    ├── SidebarWrapper (RSC) → passes promise to client
    └── app/chat/[[...chatId]]/page.tsx (RSC)
        └── ChatWrapper (RSC) → passes promise to client
```

## Key Technologies

### React 18 Features
- **`use()` hook**: Unwrap promises from server
- **Suspense**: Handle loading states and streaming
- **Streaming SSR**: `renderToPipeableStream`

### Next.js App Router 
- **Server Components**: Initial data fetching
- **Promise passing**: Server → Client without await
- **Dynamic routing**: `[[...chatId]]` for optional params

### Convex Integration
- **`preloadQuery`**: Server-side data fetching  
- **`usePreloadedQuery`**: Client-side reactive queries
- **`fetchQuery`**: Non-reactive server queries

### State Management
- **React Context**: Share thread cache
- **React Query/SWR**: Additional caching layer (optional)
- **LocalStorage**: Persist thread cache

## Proposed Solutions

### Solution 1: Hybrid SSR + SPA (Recommended)

**Structure:**
```
app/
├── layout.tsx (RSC - shell only)
├── providers.tsx (Client - all providers)
└── chat/
    ├── layout.tsx (RSC - sidebar + chat shell)
    └── [[...chatId]]/
        └── page.tsx (RSC - passes data promises)
```

**Key Points:**
- Use catch-all routes: `[[...chatId]]` 
- Server renders shell + starts data fetching
- Pass promises to client components
- Client handles all subsequent navigation
- Convex maintains reactivity

### Solution 2: Mostly Client-Side with Static Shell

**Structure:**
```
app/
├── layout.tsx (RSC - minimal shell)
└── chat/
    └── [[...chatId]]/
        └── page.tsx (RSC - static shell only)
            └── ChatApp.tsx (Client - everything)
```

**Key Points:**
- Minimal server rendering
- Everything reactive on client
- Faster to implement
- Less optimal initial load

## Implementation Patterns

### 1. Server-to-Client Data Flow

**Server Component (RSC):**
```tsx
// app/chat/layout.tsx
import { preloadQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export default async function ChatLayout({ children }) {
  // Start fetching immediately, don't await
  const threadsPromise = preloadQuery(api.threads.list)
  
  return (
    <div className="chat-layout">
      <Sidebar threadsPromise={threadsPromise} />
      {children}
    </div>
  )
}
```

**Client Component:**
```tsx
// components/Sidebar.tsx
'use client'
import { use } from 'react'
import { usePreloadedQuery } from 'convex/react'

export function Sidebar({ threadsPromise }) {
  // This streams in as data arrives
  const threads = usePreloadedQuery(threadsPromise)
  
  return (
    <aside>
      {threads.map(thread => (
        <ThreadLink key={thread._id} thread={thread} />
      ))}
    </aside>
  )
}
```

### 2. Thread Cache Provider

```tsx
// providers/ThreadCacheProvider.tsx
'use client'
const ThreadCacheContext = createContext()

export function ThreadCacheProvider({ children, initialThreads }) {
  const [cache, setCache] = useState(initialThreads || new Map())
  
  const preloadThread = useCallback((threadId) => {
    if (!cache.has(threadId)) {
      // Start fetching thread data
      const promise = convex.query(api.threads.get, { id: threadId })
      cache.set(threadId, promise)
    }
  }, [cache])
  
  return (
    <ThreadCacheContext.Provider value={{ cache, preloadThread }}>
      {children}
    </ThreadCacheContext.Provider>
  )
}
```

### 3. Instant Navigation

```tsx
// components/ThreadLink.tsx
'use client'
export function ThreadLink({ thread }) {
  const router = useRouter()
  const { preloadThread } = useThreadCache()
  
  const handleClick = (e) => {
    e.preventDefault()
    
    // Preload thread data
    preloadThread(thread._id)
    
    // Navigate without triggering SSR
    router.push(`/chat/${thread._id}`)
  }
  
  const handleMouseEnter = () => {
    // Preload on hover
    preloadThread(thread._id)
  }
  
  return (
    <Link 
      href={`/chat/${thread._id}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {thread.title}
    </Link>
  )
}
```

### 4. Chat Input Interactivity

```tsx
// components/ChatInput.tsx
'use client'
export function ChatInput() {
  const [message, setMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    // Mark as ready after hydration
    setIsReady(true)
  }, [])
  
  return (
    <form>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={!isReady} // Only disable submit, not typing
      />
      <button type="submit" disabled={!isReady}>
        Send
      </button>
    </form>
  )
}
```

### 5. URL Updates Without SSR

```tsx
// components/ChatArea.tsx
'use client'
export function ChatArea() {
  const params = useParams()
  const router = useRouter()
  const [currentThreadId, setCurrentThreadId] = useState(null)
  
  const handleNewChat = async (message) => {
    // Create new thread
    const threadId = await convex.mutation(api.threads.create, { message })
    
    // Update URL without triggering navigation
    router.replace(`/chat/${threadId}`)
    setCurrentThreadId(threadId)
  }
  
  // Use currentThreadId for rendering, not params
  const threadId = currentThreadId || params.chatId?.[0]
  
  return <Chat threadId={threadId} />
}
```

## Navigation Strategies

### Browser History API (Recommended)

```tsx
// Use shallow routing for instant navigation
const navigateToThread = (threadId) => {
  // Update URL without triggering Next.js navigation
  window.history.pushState(null, '', `/chat/${threadId}`)
  
  // Update component state
  setCurrentThreadId(threadId)
}
```

### Next.js Router with Conditions

```tsx
// Conditionally use Next.js router
const navigateToThread = (threadId) => {
  if (isFirstLoad) {
    // Allow SSR for first load
    router.push(`/chat/${threadId}`)
  } else {
    // Use client-side navigation
    setCurrentThreadId(threadId)
    window.history.pushState(null, '', `/chat/${threadId}`)
  }
}
```

## Data Fetching & Caching

### Convex + React Query Pattern

```tsx
// lib/convex-query.ts
export function convexQuery(query, args) {
  return {
    queryKey: [query._name, args],
    queryFn: () => convex.query(query, args),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }
}

// In component
const { data: threads } = useQuery(
  convexQuery(api.threads.list, {})
)
```

### LocalStorage Persistence

```tsx
// hooks/usePersistedThreads.ts
export function usePersistedThreads() {
  const [threads, setThreads] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('chat-threads')
      return cached ? JSON.parse(cached) : []
    }
    return []
  })
  
  useEffect(() => {
    localStorage.setItem('chat-threads', JSON.stringify(threads))
  }, [threads])
  
  return [threads, setThreads]
}
```

## Troubleshooting Guide

### Hydration Mismatches

**Problem**: Server and client render different content

**Solution**: Ensure consistent data between server and client
```tsx
// Use suppressHydrationWarning sparingly
<div suppressHydrationWarning>
  {isClient ? clientOnlyContent : serverContent}
</div>

// Or use useEffect to defer client-only code
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return <ServerSkeleton />
```

### Double Data Fetching

**Problem**: Server preloads data but client refetches

**Solution**: Use Convex `usePreloadedQuery` properly
```tsx
// Server: preloadQuery (don't await)
const threadsPromise = preloadQuery(api.threads.list)

// Client: usePreloadedQuery (not useQuery)
const threads = usePreloadedQuery(threadsPromise)
```

### Performance Issues

**Problem**: Too many re-renders or slow navigation

**Solutions**:
- Use `React.memo` for thread components
- Implement virtual scrolling for large thread lists
- Preload data on hover/intersection
- Use `useDeferredValue` for search

### DynamicIO Conflicts

**Problem**: DynamicIO interfering with streaming

**Solution**: Consider disabling dynamicIO for your use case:
```js
// next.config.js
module.exports = {
  experimental: {
    dynamicIO: false, // Disable if causing issues
  }
}
```

## Recommended File Structure

```
app/
├── layout.tsx                 # Root layout (minimal)
├── providers.tsx              # All providers (client)
├── globals.css               
└── chat/
    ├── layout.tsx            # Chat shell + sidebar (RSC)
    ├── loading.tsx           # Loading UI
    └── [[...chatId]]/
        └── page.tsx          # Chat page (RSC)

components/
├── chat/
│   ├── Sidebar.tsx          # Sidebar (client)
│   ├── ChatArea.tsx         # Chat area (client)
│   ├── ChatInput.tsx        # Chat input (client)
│   └── ThreadLink.tsx       # Thread link (client)
└── providers/
    ├── ConvexProvider.tsx   # Convex setup
    └── ThreadCacheProvider.tsx # Thread cache

lib/
├── convex.ts               # Convex client setup
└── utils.ts               # Utilities

convex/
├── threads.ts             # Thread queries/mutations
└── messages.ts           # Message queries/mutations
```

## Next Steps

1. **Start Simple**: Implement Solution 2 (mostly client-side) first
2. **Measure Performance**: Use Lighthouse and Core Web Vitals
3. **Optimize Gradually**: Move to Solution 1 if needed
4. **Test Edge Cases**: Direct URL access, refresh, back/forward
5. **Monitor**: Use React DevTools to debug re-renders

Remember: The goal is fast, reactive, SPA-like experience. Start simple and optimize based on real performance measurements, not theoretical concerns. 