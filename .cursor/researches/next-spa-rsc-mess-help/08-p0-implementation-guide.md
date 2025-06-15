# P0 Implementation Guide: Basic SPA

## Overview

This phase converts your current server-redirect app into a basic SPA with client-side navigation and shared thread state. **No optimistic updates yet** - just the foundation.

## Step 1: Create Basic ChatCacheProvider

```typescript
// src/providers/ChatCacheProvider.tsx
'use client'
import { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ChatCacheContextType {
  // Current thread management
  currentThreadId: string | null;
  setCurrentThreadId: (id: string | null) => void;

  // Simple navigation
  navigateToThread: (threadId: string) => void;
  createNewThread: () => void;
}

const ChatCacheContext = createContext<ChatCacheContextType | null>(null);

export function ChatCacheProvider({ children }: { children: React.ReactNode }) {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const router = useRouter();

  const navigateToThread = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
    router.push(`/chat/${threadId}`);
  }, [router]);

  const createNewThread = useCallback(() => {
    const newId = crypto.randomUUID();
    setCurrentThreadId(newId);
    router.replace(`/chat/${newId}`);
  }, [router]);

  return (
    <ChatCacheContext.Provider value={{
      currentThreadId,
      setCurrentThreadId,
      navigateToThread,
      createNewThread,
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

## Step 2: Convert to Catch-All Route

### Delete Current Files

```bash
# Remove these files:
rm src/app/chat/page.tsx
rm src/app/chat/[id]/page.tsx
```

### Create Catch-All Route

```typescript
// src/app/chat/[[...id]]/page.tsx
'use client'
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useChatCache } from '@/providers/ChatCacheProvider';
import { ChatMessages } from '@/components/chat/chat-messages';

export default function ChatPage() {
  const params = useParams();
  const { currentThreadId, setCurrentThreadId, createNewThread } = useChatCache();

  const threadId = params.id?.[0];

  useEffect(() => {
    if (!threadId) {
      // No thread ID in URL - create new thread
      createNewThread();
    } else if (threadId !== currentThreadId) {
      // URL changed - update current thread
      setCurrentThreadId(threadId);
    }
  }, [threadId, currentThreadId, setCurrentThreadId, createNewThread]);

  return <ChatMessages threadId={currentThreadId} />;
}
```

## Step 3: Update Layout with Provider

```typescript
// src/app/chat/layout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatCacheProvider } from "@/providers/ChatCacheProvider";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatCacheProvider>
      <SidebarProvider>
        <ChatSidebar />
        <main className="relative w-full">
          <SidebarTrigger className="fixed left-3 top-3 z-50 flex p-1 top-safe-offset-2" />
          {children}
        </main>
      </SidebarProvider>
    </ChatCacheProvider>
  );
}
```

## Step 4: Connect Sidebar to Real Data

```typescript
// src/components/chat/chat-sidebar.tsx
'use client'
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useChatCache } from '@/providers/ChatCacheProvider';

export function ChatSidebar() {
  const { navigateToThread, currentThreadId, createNewThread } = useChatCache();

  // Get real threads from Convex
  const threadsResult = useQuery(api.chat.getUserThreads, {
    paginationOpts: { numItems: 50 }
  });

  const handleThreadClick = (thread: any) => {
    navigateToThread(thread.uuid);
  };

  const handleNewChat = () => {
    createNewThread();
  };

  if (threadsResult === undefined) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <button
          onClick={handleNewChat}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          New Chat
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {threadsResult.results.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            No conversations yet
          </div>
        ) : (
          <div className="p-2">
            {threadsResult.results.map((thread) => (
              <button
                key={thread._id}
                onClick={() => handleThreadClick(thread)}
                className={`w-full text-left p-3 rounded-md mb-2 hover:bg-gray-100 transition-colors ${
                  currentThreadId === thread.uuid ? 'bg-blue-100 border border-blue-200' : ''
                }`}
              >
                <div className="font-medium truncate">
                  {thread.title || 'New conversation'}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {new Date(thread.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Step 5: Create ChatMessages Component

```typescript
// src/components/chat/chat-messages.tsx
'use client'
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ChatMessagesProps {
  threadId: string | null;
}

export function ChatMessages({ threadId }: ChatMessagesProps) {
  // Get thread data from Convex
  const thread = useQuery(
    api.chat.getChat,
    threadId ? { uuid: threadId } : 'skip'
  );

  if (!threadId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
          <p>Select a conversation or start a new one</p>
        </div>
      </div>
    );
  }

  if (thread === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">
          Loading conversation...
        </div>
      </div>
    );
  }

  if (thread === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">New Conversation</h2>
          <p>Start typing to begin...</p>
        </div>
      </div>
    );
  }

  // Parse messages (keeping your superjson format)
  let messages = [];
  try {
    messages = thread.messages ? JSON.parse(thread.messages) : [];
  } catch (error) {
    console.error('Failed to parse messages:', error);
    messages = [];
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message: any, index: number) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

## Testing P0

After implementing these changes, test the following:

### ✅ Basic Functionality

- [ ] Navigate to `/chat` redirects to `/chat/{uuid}` client-side
- [ ] Sidebar shows real thread list from Convex
- [ ] Clicking threads navigates without page reload
- [ ] URL updates correctly
- [ ] Current thread is highlighted in sidebar
- [ ] "New Chat" button creates new thread

### ✅ SPA Behavior

- [ ] No server round-trips when navigating between threads
- [ ] Browser back/forward buttons work
- [ ] Direct URL access works (e.g., `/chat/specific-uuid`)
- [ ] Page refresh preserves current thread

### ✅ Data Flow

- [ ] Sidebar loads real Convex data with RLS
- [ ] Thread messages display correctly
- [ ] Loading states show properly
- [ ] Error states handle gracefully

## What You Get

After P0, you'll have:

1. **✅ True SPA navigation** - No more server redirects
2. **✅ Shared thread state** - Components communicate through provider
3. **✅ Real data integration** - Sidebar connected to Convex
4. **✅ Proper loading states** - Better UX during data fetching
5. **✅ Clean architecture** - Foundation for future phases

## Notes

- **Keeping superjson**: Your existing message format works unchanged
- **Using UUIDs**: Simpler workflow, immediate URL updates
- **No optimistic updates yet**: Messages still work as before
- **RLS security**: All your existing security remains intact

This phase gives you the SPA foundation without breaking anything. The input will still work through your existing API route, and AI streaming continues as before. You're just adding client-side navigation and shared state management.

Ready for P1 when this works smoothly!
