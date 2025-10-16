import {
  PaginatedQueryArgs,
  PaginatedQueryItem,
  PaginatedQueryReference,
  UsePaginatedQueryResult,
  UsePaginatedQueryReturnType,
} from "convex/react";
import {
  FunctionArgs,
  FunctionReference,
  getFunctionName,
} from "convex/server";
import { convexToJson } from "convex/values";
import { api } from "../convex/_generated/api";

type PaginatedQueryOptions<Query extends PaginatedQueryReference> = [
  /*query: */Query,
  /*args: */PaginatedQueryArgs<Query> | "skip",
  /*options: */{
    initialNumItems: number;
    latestPageSize?: "grow" | "fixed";
  },
];

function createPaginatedQueryOptions<Query extends PaginatedQueryReference>(
  ...args: PaginatedQueryOptions<Query>
) {
  return args;  
}

interface PaginatedOptionBuilderContext<Context> {
  __query: Query extends PaginatedQueryReference
}

class PaginatedOptionBuilder<Context> {
  __query: Query extends PaginatedQueryReference
}

export const Component = () => {
  const doSkip = false;
  const options = optionBuilder(api.chat.getUserThreadsForListing)
    .initialNumItems(50)
    .latestPageSize('grow')
    .skip(doSkip)
    .build();
  const { isLoading, isStale, loadMore, results, status } = useQueryWithLocalCache(...options)

  return <>

  </>
}

export function useQueryWithLocalCache<Query extends PaginatedQueryReference>(
  query: Query,
  args: PaginatedQueryArgs<Query> | "skip",
  options: {
    initialNumItems: number;
    latestPageSize?: "grow" | "fixed";
  }
): UsePaginatedQueryReturnType<Query> & {
  isStale: boolean;
} {
  void [query, args, options];
  throw Error("To Implement");
}

export function setQueryLocalCache<Query extends PaginatedQueryReference>(
  query: Query,
  args: PaginatedQueryArgs<Query> | "skip",
  options: {
    initialNumItems: number;
    latestPageSize?: "grow" | "fixed";
  }
): void {
  void [query, args, options];
  throw Error("To Implement");
}

/**
 * Generate a query key from a query function and its arguments.
 * @param query Query function reference like api.foo.bar
 * @param args Arguments to the function, like { foo: "bar" }
 * @returns A string key that uniquely identifies the query and its arguments.
 */
function createQueryKey<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>
): string {
  const queryString = getFunctionName(query);
  const key = [queryString, convexToJson(args)];
  const queryKey = JSON.stringify(key);
  return queryKey;
}
