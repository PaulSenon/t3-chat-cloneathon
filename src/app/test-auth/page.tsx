"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";

export default function TestAuthPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const result = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <div className="mb-4">
        <div className="text-green-600">✅ Authenticated & User Ready</div>
        <div className="text-sm text-gray-600">
          RLS queries will work perfectly!
        </div>
      </div>
      <pre className="p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
