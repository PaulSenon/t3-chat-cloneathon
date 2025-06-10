# RLS Integration Pattern

## ✅ Standard Pattern (Recommended)

### 1. Frontend: Ensure User After Sign-In

```typescript
// In your app (Next.js, React, etc.)
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";

export function useEnsureUser() {
  const { isAuthenticated } = useConvexAuth();
  const ensureUser = useMutation(api.users.ensureUserExists);

  useEffect(() => {
    if (isAuthenticated) {
      ensureUser(); // Call once after sign-in
    }
  }, [isAuthenticated]);
}

// Or in Clerk's onSignIn callback:
// await convex.mutation(api.users.ensureUserExists, {});
```

### 2. Backend: Use RLS Functions Everywhere

```typescript
// All your functions just work - users exist automatically
export const getMyThreads = queryWithRLS({
  handler: async (ctx) => {
    return await ctx.db.query("threads").collect(); // ✅ Automatic filtering
  },
});

export const createThread = mutationWithRLS({
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db.insert("threads", {
      userId: user._id,
      ...args,
    }); // ✅ Automatic security
  },
});
```

## 🎯 Why This Works

- **✅ Robust**: Works for both queries and mutations
- **✅ Predictable**: Clear two-step process
- **✅ Standard**: Follows Convex community best practices
- **✅ Secure**: Fails safely if user creation is forgotten
- **✅ Simple**: Just call ensureUserExists() once after sign-in

## 🚨 What Happens If You Forget?

- **Queries**: Return empty results (secure by default)
- **Mutations**: Throw authentication errors (secure by default)
- **No data leaks**: RLS prevents access to other users' data

The system fails safely! 🛡️
