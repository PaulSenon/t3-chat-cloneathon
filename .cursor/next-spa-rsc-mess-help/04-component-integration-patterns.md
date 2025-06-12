# Component Integration Patterns

## The "Static Shell + Dynamic Content" Problem

You asked a great question about ChatInput integration. The issue is: how do you have a static server-rendered shell that seamlessly integrates with dynamic client components?

## Component Hierarchy Architecture

### Current Structure (What You Have)

```text
app/chat/layout.tsx (RSC)
├── SidebarProvider
├── ChatSidebar (Client)
└── main
    └── app/chat/[id]/page.tsx (Client)
        └── Chat (Client) // ❌ This is where integration breaks
```

**Problem**: `ChatInput` needs to be in the static shell for instant interactivity, but `Chat` component handles the thread state.

### Better Structure (Separation of Concerns)

```text
app/chat/layout.tsx (RSC)
├── ChatCacheProvider (Client)
├── SidebarProvider
├── ChatSidebar (Client)
└── main
    ├── ChatInput (Client) // ✅ Always interactive
    └── app/chat/[[...id]]/page.tsx (RSC)
        └── ChatMessages (Client) // ✅ Separate concerns
```

## Complete Integration Example

### 1. **Layout with Integrated ChatInput**

```typescript
// app/chat/layout.tsx (RSC)
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatCacheProvider } from "@/providers/ChatCacheProvider";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatCacheProvider>
      <SidebarProvider>
        <div className="flex h-screen">
          <ChatSidebar />

          <main className="flex-1 flex flex-col">
            {/* Header */}
            <header className="border-b p-4">
              <SidebarTrigger />
            </header>

            {/* Messages Area - Dynamic Content */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>

            {/* Input - Always Interactive */}
            <div className="border-t p-4">
              <ChatInput />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ChatCacheProvider>
  );
}
```

### 2. **Smart ChatInput Component**

```typescript
// components/chat/chat-input.tsx
'use client'
import { useState, useRef, useCallback } from 'react';
import { useChat } from 'ai/react';
import { useChatCache } from '@/providers/ChatCacheProvider';

export function ChatInput() {
  const { currentThreadId, createNewThread } = useChatCache();
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // AI SDK useChat hook - handles the streaming
  const { append, isLoading } = useChat({
    api: '/api/chat',
    body: {
      id: currentThreadId, // Current thread or will create new one
    },
    onFinish: (message) => {
      // Clear input after successful send
      setMessage('');
      // Focus back to input
      inputRef.current?.focus();
    },
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    // If no thread selected, create new one
    if (!currentThreadId) {
      createNewThread();
    }

    // Send message via AI SDK
    await append({
      content: message,
      role: 'user',
    });
  }, [message, currentThreadId, createNewThread, append, isLoading]);

  // Always interactive after hydration
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={isLoading}
        className="flex-1 px-3 py-2 border rounded-md"
      />
      <button
        type="submit"
        disabled={!message.trim() || isLoading || !isHydrated}
        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

### 3. **Simplified Page Component**

```typescript
// app/chat/[[...id]]/page.tsx (RSC to Client)
import { ChatMessages } from '@/components/chat/chat-messages';

export default function ChatPage() {
  // No logic here - just render messages
  // All state management happens in providers and components
  return <ChatMessages />;
}
```

### 4. **ChatMessages Component**

```typescript
// components/chat/chat-messages.tsx
'use client'
import { useQuery } from 'convex/react';
import { useChatCache } from '@/providers/ChatCacheProvider';
import { api } from '@/convex/_generated/api';
import { useChat } from 'ai/react';

export function ChatMessages() {
  const { currentThreadId } = useChatCache();

  // Get thread data from Convex
  const thread = useQuery(
    api.chat.getChat,
    currentThreadId ? { uuid: currentThreadId } : 'skip'
  );

  // AI SDK streaming state (synced with the same thread)
  const { messages } = useChat({
    api: '/api/chat',
    body: { id: currentThreadId },
    initialMessages: thread?.messages ? JSON.parse(thread.messages) : [],
  });

  if (!currentThreadId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Start a new conversation</p>
      </div>
    );
  }

  if (!thread && currentThreadId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}>
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## How This Solves Integration Problems

### 1. **Always Interactive Input**

- ChatInput is rendered in the layout (static shell)
- Immediately interactive after hydration
- No waiting for thread data to load

### 2. **Seamless State Sharing**

- `ChatCacheProvider` provides shared state
- `currentThreadId` links input and messages
- `useChat` hook syncs between components

### 3. **Clean Separation**

- Layout handles shell structure
- Page handles routing
- Components handle specific functionality

### 4. **No Hydration Issues**

- Input is always the same between server/client
- Thread messages load separately
- No mismatched content

## Advanced Integration Patterns

### 1. **Thread Creation Flow**

```typescript
// Enhanced ChatInput with thread creation
export function ChatInput() {
  const { currentThreadId, setCurrentThreadId } = useChatCache();
  const router = useRouter();

  const { append, isLoading } = useChat({
    api: "/api/chat",
    body: { id: currentThreadId },
    onResponse: async (response) => {
      // Get the new thread ID from response headers
      const threadId = response.headers.get("X-Thread-Id");
      if (threadId && !currentThreadId) {
        // Update URL for new thread
        router.replace(`/chat/${threadId}`);
        setCurrentThreadId(threadId);
      }
    },
  });

  // Rest of component...
}
```

### 2. **Multi-Provider Architecture**

```typescript
// app/chat/layout.tsx - Multiple providers for different concerns
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider>
      <ChatCacheProvider>
        <OptimisticUpdatesProvider>
          <SidebarProvider>
            {/* Layout structure */}
          </SidebarProvider>
        </OptimisticUpdatesProvider>
      </ChatCacheProvider>
    </ConvexProvider>
  );
}
```

### 3. **Event-Driven Communication**

```typescript
// For complex cross-component communication
export function useChatEvents() {
  const [events] = useState(() => new EventTarget());

  const emit = useCallback(
    (event: string, data: any) => {
      events.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    [events]
  );

  const on = useCallback(
    (event: string, handler: (e: CustomEvent) => void) => {
      events.addEventListener(event, handler as EventListener);
      return () => events.removeEventListener(event, handler as EventListener);
    },
    [events]
  );

  return { emit, on };
}

// Usage in components
const { emit } = useChatEvents();
emit("message-sent", { threadId, message });
```

This architecture gives you:

- ✅ **Instant interactivity**: Input always ready
- ✅ **Clean separation**: Each component has clear responsibility
- ✅ **Shared state**: Components communicate through providers
- ✅ **SPA experience**: No server round-trips
- ✅ **Scalable**: Easy to add new features
