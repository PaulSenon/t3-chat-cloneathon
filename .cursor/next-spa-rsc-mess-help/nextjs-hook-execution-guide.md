# Next.js Custom Hook Execution Guide

## The Key Rule: Most Hooks Execute on the Client

**🚨 IMPORTANT UNDERSTANDING**: Most hooks in Next.js execute on the client-side, but there are exceptions. React 18+ and Next.js allow certain hooks in Server Components.

## Why the Confusion?

The confusion comes from Next.js having different component types:

- **Server Components** (default in App Router)
- **Client Components** (marked with `"use client"`)

## Hook Execution Rules

### ✅ Hooks that CAN be used in Server Components
```tsx
import { cache } from "react";
import { cookies, headers } from "next/headers";

// ✅ These work in Server Components
export default async function ServerPage() {
  const cookieStore = cookies(); // ✅ Next.js server hook
  const headersList = headers(); // ✅ Next.js server hook
  
  // ✅ React cache works on server
  const getCachedData = cache(async (id: string) => {
    return await fetch(`/api/data/${id}`);
  });
  
  return <div>Server component with server hooks</div>;
}
```

### ❌ Hooks that CANNOT be used in Server Components
```tsx
// ❌ This will cause an error
import { useState, useEffect } from "react";

// This is a Server Component by default in App Router
export default function ServerPage() {
  const [count, setCount] = useState(0); // ❌ ERROR!
  useEffect(() => {}, []); // ❌ ERROR!

  return <div>Count: {count}</div>;
}
```

### ✅ Hooks can ONLY be used in Client Components

```tsx
"use client"; // This directive makes it a Client Component

import { useState } from "react";

// Now this component runs on the client
export default function ClientPage() {
  const [count, setCount] = useState(0); // ✅ Works!

  return <div>Count: {count}</div>;
}
```

## Custom Hook Execution Examples

### Example 1: Client-Side Custom Hook

```tsx
// hooks/useCounter.ts
"use client"; // Optional here, but good practice

import { useState } from "react";

export function useCounter() {
  const [count, setCount] = useState(0);

  const increment = () => setCount((c) => c + 1);

  return { count, increment };
}
```

```tsx
// components/Counter.tsx
"use client"; // Required because we're using hooks

import { useCounter } from "../hooks/useCounter";

export default function Counter() {
  const { count, increment } = useCounter(); // Executes on client

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### Example 2: Data Fetching Hook (Client-Side)

```tsx
// hooks/useAPI.ts
"use client";

import { useState, useEffect } from "react";

export function useAPI<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This fetch happens on the client
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}
```

## When Hooks Execute in the Client Lifecycle

### 1. Initial Server Render (SSR)

- Server renders the initial HTML
- **No hooks execute** during server render
- Only the server-side parts of Client Components run

### 2. Client Hydration

- React takes over on the client
- **All hooks execute** during hydration
- Component state is initialized

### 3. Client Interactions

- User interactions trigger re-renders
- **Hooks execute** on every re-render

## Common Misconceptions

### ❌ "My hook runs on the server because I see console.logs"

```tsx
"use client";

import { useEffect } from "react";

export function MyComponent() {
  useEffect(() => {
    console.log("This runs on CLIENT, not server");
    // Even though you might see this in terminal during dev,
    // it's actually running in your browser's console
  }, []);

  return <div>Hello</div>;
}
```

### ❌ "Server Actions make hooks run on server"

```tsx
"use client";

import { useState } from "react";
import { serverAction } from "./actions";

export function MyForm() {
  const [data, setData] = useState(""); // Client-side hook

  const handleSubmit = async () => {
    await serverAction(data); // This runs on server
    setData(""); // This hook update runs on client
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={data} onChange={(e) => setData(e.target.value)} />
    </form>
  );
}
```

## Server vs Client Pattern Examples

### Server Data Fetching (No Hooks)

```tsx
// app/users/page.tsx - Server Component
async function getUsers() {
  // This runs on the server
  const res = await fetch("https://api.example.com/users");
  return res.json();
}

export default async function UsersPage() {
  const users = await getUsers(); // Server-side data fetching

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Client Data Fetching (With Hooks)

```tsx
// components/UsersList.tsx - Client Component
"use client";

import { useState, useEffect } from "react";

export default function UsersList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // This runs on the client
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

## Advanced: Hybrid Patterns

### Server Component with Client Islands

```tsx
// app/dashboard/page.tsx - Server Component
async function getStaticData() {
  // Server-side data fetching
  return await fetch("https://api.example.com/static-data");
}

export default async function Dashboard() {
  const staticData = await getStaticData();

  return (
    <div>
      <h1>Dashboard</h1>
      <StaticSection data={staticData} />
      <InteractiveChart /> {/* Client Component with hooks */}
    </div>
  );
}
```

```tsx
// components/InteractiveChart.tsx - Client Component
"use client";

import { useState, useEffect } from "react";

export default function InteractiveChart() {
  const [chartData, setChartData] = useState(null);

  // This hook executes on the client
  useEffect(() => {
    loadChartData().then(setChartData);
  }, []);

  return <div>Interactive chart with client-side hooks</div>;
}
```

## Summary

| Component Type   | Hook Execution             | When to Use                          |
| ---------------- | -------------------------- | ------------------------------------ |
| Server Component | ❌ No hooks allowed        | Static content, server data fetching |
| Client Component | ✅ Hooks execute on client | Interactive features, client state   |

**Remember**:

- Hooks = Client-side ONLY
- Server Components = No hooks allowed
- Client Components = Hooks work normally
- Data fetching can happen on both server (Server Components) and client (hooks in Client Components)

The key is understanding **where** your component needs to run, not **where** your hooks run (they're always client-side).
