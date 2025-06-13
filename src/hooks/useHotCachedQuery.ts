import { useQuery } from "convex-helpers/react/cache/hooks";
import { FunctionReference, FunctionReturnType } from "convex/server";
import {
  OptionalRestArgsOrSkip,
  PaginatedQueryArgs,
  PaginatedQueryReference,
  usePaginatedQuery,
  UsePaginatedQueryReturnType,
} from "convex/react";

export function useHotCachedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...queryArgs: OptionalRestArgsOrSkip<Query>
): FunctionReturnType<Query> | undefined {
  const remoteData = useQuery(query, ...queryArgs);

  return remoteData;
}

export function useHotCachedPaginatedQuery<
  Query extends PaginatedQueryReference,
>(
  query: Query,
  args: PaginatedQueryArgs<Query> | "skip",
  options: {
    initialNumItems: number;
    latestPageSize?: "grow" | "fixed";
  }
): UsePaginatedQueryReturnType<Query> {
  const remoteData = usePaginatedQuery(query, args, options);

  return remoteData;
}
