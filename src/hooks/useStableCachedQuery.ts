import { useRef } from "react";
import { useQuery as useCachedQuery } from "convex-helpers/react/cache/hooks";
import {
  FunctionReference,
  FunctionReturnType,
  getFunctionName,
} from "convex/server";
import { OptionalRestArgsOrSkip } from "convex/react";
import { useAuth } from "@/hooks/useAuth";

export function useStableCachedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...queryArgs: OptionalRestArgsOrSkip<Query>
): FunctionReturnType<Query> | undefined {
  console.log("useStableCachedQuery", getFunctionName(query), queryArgs);
  const { isAuthenticated } = useAuth();
  const result = useCachedQuery(
    query,
    ...(isAuthenticated ? queryArgs : ["skip"])
  );
  const stored = useRef(result);

  if (result !== undefined) {
    stored.current = result;
  }
  return stored.current;
}
