"use client";

import {
  FunctionReference,
  FunctionReturnType,
  getFunctionName,
} from "convex/server";
import {
  OptionalRestArgsOrSkip,
  PaginatedQueryArgs,
  PaginatedQueryReference,
} from "convex/react";
import type {
  UsePaginatedQueryResult,
  PaginatedQueryItem,
  UsePaginatedQueryReturnType,
} from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalCache } from "@/providers/LocalCacheProvider";
import {
  useHotCachedPaginatedQuery,
  useHotCachedQuery,
} from "./useHotCachedQuery";
import { useAuth } from "./useAuth";
import { convexToJson, type Value } from "convex/values";

// TODO: cache all paginated result hook props, not just the result
export function useColdCachedPaginatedQuery<
  Query extends PaginatedQueryReference,
>(
  query: Query,
  args: PaginatedQueryArgs<Query> | "skip",
  options: {
    initialNumItems: number;
    latestPageSize?: "grow" | "fixed";
  }
): UsePaginatedQueryResult<PaginatedQueryItem<Query>> & {
  isStale: boolean;
} {
  const {
    isFullyReady: isAuthenticated,
    isLoadingClerk: isLoadingAuth,
    isSignedInClerk: isUserSignedIn,
  } = useAuth();
  // TODO useAuth
  // NB. for staleResults, undefined means "not loaded yet" and null means "no data", empty array means "no results"
  const [stalePaginatedData, setStalePaginatedData] =
    useState<UsePaginatedQueryReturnType<Query>>();

  const isSkip = args === "skip";
  const cacheKey = useRef<string>(
    hashCacheKey(getFunctionName(query), args, options)
  );
  const cache = useLocalCache();

  // load remote paginated data
  const remotePaginatedData = useHotCachedPaginatedQuery(
    query,
    isAuthenticated ? args : "skip",
    options
  );

  // load stale data from cache if available
  useEffect(() => {
    // don't load from cache if skip mode
    if (isSkip) return;
    // don't load from cache if cache not ready
    if (!cache.isReady) return;

    const data = cache.get(cacheKey.current);
    console.log("DEBUG: get from paginated cache", {
      cacheKey: cacheKey.current,
      data,
    });
    // todo: zod validation
    if (data !== undefined) {
      setStalePaginatedData(data as UsePaginatedQueryReturnType<Query>);
    }
  }, [isSkip, cache]);

  // save remote data to cache when results change
  useEffect(() => {
    // don't save to cache if skip mode
    if (isSkip) return;
    // don't save to cache if user is not signed in
    if (!isUserSignedIn) return;
    // don't save to cache if cache not ready
    if (!cache.isReady) return;
    // don't save to cache if remote data is still loading initially
    if (remotePaginatedData.isLoading) return;

    // Save the current results array to cache
    console.log("DEBUG: set to paginated cache", {
      cacheKey: cacheKey.current,
      data: remotePaginatedData,
    });
    cache.set(cacheKey.current, remotePaginatedData);
  }, [remotePaginatedData, cache, isSkip, isUserSignedIn]);

  // This is a weird bug where the paginated query says Exhausted and isLoading is false, but there is an empty array of results. The results are coming 1ms later but it flickers the "loaded but empty" state of UI. Instead we return stale data if it's available
  const isPaginatedLoadingBug =
    !remotePaginatedData.isLoading &&
    remotePaginatedData.results.length === 0 &&
    stalePaginatedData !== undefined;

  const isRemoteDataLoading = remotePaginatedData.isLoading;

  // console.log("DEBUG: results", {
  //   isPaginatedLoadingBug,
  //   isRemoteDataLoading,
  //   stalePaginatedData,
  //   remotePaginatedData,
  //   isUserSignedIn,
  //   isAuthenticated,
  // });

  if (isLoadingAuth) {
    return {
      ...remotePaginatedData,
      status: "LoadingFirstPage",
      isLoading: true,
      isStale: false,
    };
  } else if (!isUserSignedIn) {
    return {
      ...remotePaginatedData,
      status: "Exhausted",
      isLoading: false,
      isStale: false,
    };
  }

  if (isRemoteDataLoading) {
    if (!stalePaginatedData) {
      return {
        loadMore: remotePaginatedData.loadMore,
        results: [],
        status: "LoadingFirstPage",
        isLoading: true,
        isStale: true,
      };
    } else {
      return {
        loadMore: remotePaginatedData.loadMore,
        results: stalePaginatedData?.results ?? [],
        status: stalePaginatedData?.status as "Exhausted" | "CanLoadMore",
        isLoading: false,
        isStale: true,
      };
    }
  }

  return {
    ...remotePaginatedData,
    isStale: false,
  };
}

export function useColdCachedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...queryArgs: OptionalRestArgsOrSkip<Query>
): {
  data: Query["_returnType"] | undefined;
  isStale: boolean;
} {
  const { isFullyReady: isAuthenticated, isSignedInClerk: isUserSignedIn } =
    useAuth();
  const {
    isReady: isCacheReady,
    get: getCache,
    set: setCache,
    delete: deleteCache,
  } = useLocalCache();
  const isSkip = queryArgs[0] === "skip" || !isCacheReady;
  const queryNameString = getFunctionName(query);
  const queryArgsString = JSON.stringify(queryArgs);
  const cacheKey = useMemo(() => {
    if (isSkip) return null;
    const key = hashCacheKey(queryNameString, queryArgsString);
    return key;
  }, [queryNameString, queryArgsString, isSkip]);
  const prevCacheKey = useRef<string | null>(null);

  // const staleDataRef = useRef<Query["_returnType"] | undefined>(undefined);
  const [staleData, setStaleData] = useState<
    Query["_returnType"] | undefined
  >();

  const remoteData = useHotCachedQuery(
    query,
    ...(isAuthenticated ? queryArgs : ["skip"])
  );

  // load stale data from cache if available
  useEffect(() => {
    if (isSkip) return;
    if (prevCacheKey.current !== cacheKey && cacheKey !== null) {
      prevCacheKey.current = cacheKey;
      const data = getCache(cacheKey);
      console.log("DEBUG: get from cache", {
        cacheKey,
        data,
      });
      // staleDataRef.current = data;
      setStaleData(data);
    }
  }, [isSkip, cacheKey, getCache]);

  // persist remote data to cache when results change
  useEffect(() => {
    if (!isUserSignedIn) return;
    if (isSkip) return;
    if (cacheKey === null) return;
    if (remoteData === undefined) return; // don't store while loading

    if (remoteData === null) {
      console.log("DEBUG: delete from cache", {
        queryName: queryNameString,
        queryArgs,
        cacheKey,
      });
      deleteCache(cacheKey);
    } else {
      console.log("------- DEBUG: SET to cache", {
        queryName: queryNameString,
        queryArgs,
        cacheKey,
        data: remoteData,
      });
      setCache(cacheKey, remoteData);
    }
  }, [isSkip, cacheKey, remoteData, setCache, deleteCache, isUserSignedIn]);

  if (isSkip) {
    return {
      data: undefined,
      isStale: false,
    };
  }

  if (remoteData === undefined && staleData === undefined) {
    return {
      data: undefined,
      isStale: false,
    };
  } else if (remoteData === undefined) {
    return {
      data: staleData,
      isStale: true,
    };
  } else {
    return {
      data: remoteData,
      isStale: false,
    };
  }
}

/**
 * @deprecated use useColdCachedQuery instead
 */
export function useColdCachedQueryDeprecated<
  Query extends FunctionReference<"query">,
>(
  query: Query,
  ...queryArgs: OptionalRestArgsOrSkip<Query>
): {
  data: Query["_returnType"] | undefined;
  isStale: boolean;
} {
  const { isFullyReady: isAuthenticated, isSignedInClerk: isUserSignedIn } =
    useAuth();

  // NB. for data, undefined means "not loaded yet" and null means "no data"
  const [staleData, setStaleData] = useState<
    FunctionReturnType<Query> | null | undefined
  >(undefined);

  const isSkip = queryArgs[0] === "skip";
  const argsObject = isSkip ? {} : (queryArgs[0] ?? {});
  const queryName = getFunctionName(query);
  const cache = useLocalCache();

  // Current state tracking
  const currentCacheKey = useRef<string>(
    hashCacheKey(queryName, convexToJson(argsObject))
  );
  const [lastSeenArgs, setLastSeenArgs] = useState(() =>
    JSON.stringify(convexToJson(argsObject as Value))
  );

  // Handle query changes synchronously in render (like convex-helpers)
  const currentArgsString = JSON.stringify(convexToJson(argsObject as Value));
  if (currentArgsString !== lastSeenArgs) {
    // Query changed - reset state and update cache key
    setStaleData(undefined);
    currentCacheKey.current = hashCacheKey(queryName, convexToJson(argsObject));
    setLastSeenArgs(currentArgsString);
    // console.log("Query changed, resetting cache", {
    //   oldArgs: lastSeenArgs,
    //   newArgs: currentArgsString,
    //   newCacheKey: currentCacheKey.current,
    // });
  }

  // load remote data
  const remoteData = useHotCachedQuery(
    query,
    ...(isAuthenticated ? queryArgs : ["skip"])
  );

  // load stale data from cache if available
  useEffect(() => {
    // don't load from cache if skip mode
    if (isSkip) return;
    // don't load from cache if cache not ready
    if (!cache.isReady) return;

    const data = cache.get(currentCacheKey.current);
    // console.log("get from cache", {
    //   cacheKey: currentCacheKey.current,
    //   data,
    // });
    if (data !== undefined) {
      setStaleData(data);
    } else {
      setStaleData(null); // no data (explicitly)
    }
  }, [isSkip, cache]);

  // save remote data to cache
  useEffect(() => {
    // don't save to cache if user is not authenticated
    if (!isUserSignedIn) return;
    // don't save to cache if skip mode
    if (isSkip) return;
    // don't save to cache if cache not ready
    if (!cache.isReady) return;
    // don't save to cache if remote data is still loading
    if (remoteData === undefined || remoteData === null) return;

    cache.set(currentCacheKey.current, remoteData);
    // console.log("set to cache", {
    //   cacheKey: currentCacheKey.current,
    //   data: remoteData,
    // });
  }, [remoteData, cache, isSkip, isUserSignedIn]);

  if (remoteData === undefined && staleData === undefined) {
    return {
      data: undefined,
      isStale: false,
    };
  } else if (remoteData === undefined) {
    return {
      data: staleData,
      isStale: true,
    };
  } else {
    return {
      data: remoteData,
      isStale: false,
    };
  }
}

function hashCacheKey(...args: unknown[]): string {
  const data = args
    .map((arg) =>
      typeof arg === "object" && arg !== null
        ? JSON.stringify(arg, Object.keys(arg).sort())
        : String(arg)
    )
    .join("|");

  return xxhash64(data);
}

// Fastest option with excellent collision resistance
function xxhash64(str: string, seed = 0): string {
  // Simple 64-bit version (good enough for cache keys)
  let h1 = seed + 0x9e3779b1;
  let h2 = seed + 0x85ebca77;

  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x85ebca6b) ^ (h1 >>> 13);
    h2 = Math.imul(h2 ^ c, 0xc2b2ae3d) ^ (h2 >>> 16);
  }

  // Combine to 64-bit-like result
  const combined = (h1 + h2) * 0x9e3779b1;
  return (
    (combined >>> 0).toString(36) +
    ((combined / 0x100000000) >>> 0).toString(36)
  );
}
