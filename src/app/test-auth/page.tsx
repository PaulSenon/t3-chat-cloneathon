"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function TestAuthPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const result = useQuery(api.test.testAuth, isAuthenticated ? {} : "skip");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <pre className="p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
