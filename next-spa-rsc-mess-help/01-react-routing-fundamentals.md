# React Routing Fundamentals: Building Your Own Router

## What Is Client-Side Routing?

Client-side routing is about **changing what the user sees without making a network request**. It's essentially:

1. **URL Management**: Updating `window.location` without page reload
2. **Component Switching**: Showing different components based on the URL
3. **History Management**: Making browser back/forward work

## Building a Basic Router from Scratch

Let's build a simple router to understand the fundamentals:

### Step 1: URL Watching

```typescript
// Basic URL state management
function useUrl() {
  const [url, setUrl] = useState(window.location.pathname);
  
  useEffect(() => {
    const handlePopState = () => {
      setUrl(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  const navigate = (newUrl: string) => {
    window.history.pushState(null, '', newUrl);
    setUrl(newUrl);
  };
  
  return { url, navigate };
}
```

### Step 2: Route Matching

```typescript
// Simple route matcher
function matchRoute(pattern: string, url: string) {
  // Convert /chat/:id to /chat/([^/]+)
  const regex = pattern.replace(/:(\w+)/g, '([^/]+)');
  const match = url.match(new RegExp(`^${regex}$`));
  
  if (!match) return null;
  
  // Extract params
  const paramNames = pattern.match(/:(\w+)/g)?.map(p => p.slice(1)) || [];
  const params = {};
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1];
  });
  
  return { params };
}

// Usage
matchRoute('/chat/:id', '/chat/123') // { params: { id: '123' } }
matchRoute('/chat/:id', '/about')    // null
```

### Step 3: Router Component

```typescript
interface Route {
  path: string;
  component: React.ComponentType<any>;
}

function Router({ routes }: { routes: Route[] }) {
  const { url } = useUrl();
  
  for (const route of routes) {
    const match = matchRoute(route.path, url);
    if (match) {
      const Component = route.component;
      return <Component {...match.params} />;
    }
  }
  
  return <div>404 - Page not found</div>;
}

// Usage
<Router routes={[
  { path: '/chat/:id', component: ChatPage },
  { path: '/chat', component: NewChatPage },
  { path: '/', component: HomePage },
]} />
```

### Step 4: Navigation Hook

```typescript
function useRouter() {
  const { url, navigate } = useUrl();
  
  return {
    currentPath: url,
    push: navigate,
    replace: (newUrl: string) => {
      window.history.replaceState(null, '', newUrl);
      // Trigger re-render (you'd need to connect this to your URL state)
    }
  };
}
```

## Key Insights

### 1. Component Mounting/Unmounting

```typescript
// This creates NEW component instances
<Router routes={[
  { path: '/chat/:id', component: ChatPage }, // Different component per route
]} />

// This reuses the SAME component instance  
function App() {
  const { id } = useParams();
  return <ChatPage threadId={id} />; // Same component, different props
}
```

**Critical Difference:**
- **Route-based**: New component = fresh state
- **Prop-based**: Same component = persistent state

### 2. State Persistence Patterns

```typescript
// Pattern 1: Component-level state (lost on unmount)
function ChatPage() {
  const [messages, setMessages] = useState([]); // Lost when component unmounts
  return <div>...</div>;
}

// Pattern 2: Global state (persists across unmounts)
function ChatPage() {
  const messages = useGlobalChatState(threadId); // Persists
  return <div>...</div>;
}

// Pattern 3: Key-based remounting (fresh state per key)
function App() {
  return <ChatPage key={threadId} />; // New component per threadId
}
```

## Popular Router Libraries

### React Router
```typescript
// Declarative routing
<BrowserRouter>
  <Routes>
    <Route path="/chat/:id" element={<ChatPage />} />
    <Route path="/chat" element={<NewChatPage />} />
  </Routes>
</BrowserRouter>
```

### TanStack Router
```typescript
// Type-safe routing
const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/$id',
  component: ChatPage,
})
```

## Your Specific Challenge

Your issue stems from **mixing routing paradigms**:

```typescript
// Problem: Same component instance, changing props
function Chat() {
  const { currentThreadId } = useChatState(); // Changes via props
  const { messages } = useChat({ id: currentThreadId }); // State persists!
}

// Solution 1: Force new instances
<Chat key={currentThreadId} />

// Solution 2: Separate route components
// /chat -> <NewChatPage />
// /chat/[id] -> <ExistingChatPage />

// Solution 3: Handle state transitions in useChat
// (More complex, requires useChat modifications)
```

## Mental Model Summary

1. **URLs change** → Triggers re-render
2. **Route matching** → Determines which component to show
3. **Component mounting** → Determines state lifecycle
4. **State persistence** → Depends on component lifecycle + external stores

The key insight: **Component boundaries define state boundaries**. If you want isolated state, you need isolated components.

Next, let's look at how Next.js App Router adds complexity to this simple model... 