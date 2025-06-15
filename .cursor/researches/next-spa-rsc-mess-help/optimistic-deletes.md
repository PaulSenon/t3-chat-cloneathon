# Optimistic Deletes in Convex with Paginated Queries

This guide explains how to implement optimistic deletes for a list of items fetched with a paginated query in Convex and React. This pattern makes your UI feel faster by immediately removing an item from the list while the server-side deletion is in progress.

## The Core Concept

The key is to use the `.withOptimisticUpdate` method on a `useMutation` hook. This allows you to temporarily modify the local cache of a query's results.

Here's the general flow:

1. **Trigger a mutation:** A user action (like clicking a delete button) calls a Convex mutation.
2. **Apply optimistic update:** Before the mutation is sent to the server, the `withOptimisticUpdate` function runs.
3. **Read local data:** Inside the update function, you read the current data for your paginated query from the `localStore`.
4. **Modify local data:** You create a _new_ array of results with the target item filtered out.
5. **Write local data:** You write this new array back to the `localStore` for the same query.
6. **UI updates:** React re-renders with the modified (smaller) list, making the deletion appear instant.
7. **Server confirms:** The actual mutation runs on the server.
8. **Re-synchronization:** Once the mutation completes, Convex automatically sends the "true" state from the server, replacing your optimistic update. If the server-side deletion was successful, the item will remain gone. If it failed, the item will reappear.

## Step-by-Step Implementation

Let's assume you have a paginated query for a list of threads and a mutation to delete a thread.

### 1. The Paginated Query

You are likely using `usePaginatedQuery` (or a wrapper like `useColdCachedPaginatedQuery`) to fetch your data.

```typescript
// convex/chat.ts
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getUserThreadsForListing = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    // ... your query logic
    return await db.query("threads").paginate(args.paginationOpts);
  },
});
```

### 2. The Delete Mutation

You need a mutation that takes the ID of the document to delete.

```typescript
// convex/chat.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteThread = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.threadId);
  },
});
```

_Note: In our project, this should be `mutationWithRLS`._

### 3. The React Component

In your component, you'll use `useMutation` with `.withOptimisticUpdate`.

```tsx
// src/components/chat/chat-sidebar.tsx
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// ... inside your component

const deleteThread = useMutation(api.chat.deleteThread).withOptimisticUpdate(
  (localStore, { threadId }) => {
    // 1. Find the paginated query to update in the local store.
    // The arguments must match the `usePaginatedQuery` call exactly.
    const queryArgs = {}; // Or whatever args you use
    const existingThreads = localStore.getQuery(
      api.chat.getUserThreadsForListing,
      queryArgs
    );

    if (existingThreads !== undefined) {
      // 2. Remove the deleted thread from the results.
      // IMPORTANT: The result of a paginated query is an array of items,
      // not the PaginationResult object.
      const newThreads = existingThreads.filter(
        (thread) => thread._id !== threadId
      );

      // 3. Write the new data back to the local store.
      localStore.setQuery(
        api.chat.getUserThreadsForListing,
        queryArgs,
        newThreads
      );
    }
  }
);

const handleDelete = (threadId: Id<"threads">) => {
  deleteThread({ threadId });
};
```

### Important Considerations

- **Argument Matching:** The arguments passed to `localStore.getQuery` and `localStore.setQuery` _must exactly match_ the arguments used in the corresponding `usePaginatedQuery` hook. If they don't match, Convex won't find the cached data to update.
- **Immutability:** Always create a new array/object when updating the local store (e.g., using `.filter()` or the spread syntax `[...]`). Do not mutate the existing data directly.
- **Paginated Data Structure:** The `usePaginatedQuery` hook's `results` is a flat array of all loaded items across all pages. The `localStore.getQuery` for a paginated query will also return this flat array. You don't need to worry about the page structure (cursors, `isDone`, etc.) inside the optimistic update itself. Convex handles that.
- **Custom Hooks:** If you use a custom wrapper around `usePaginatedQuery` (like `useColdCachedPaginatedQuery` in this project), the principle is the same. You need to identify the underlying `api` function and arguments it uses.
