"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import superjson from "superjson";

function loadFromLocalStorage(): [string, object][] {
  try {
    const savedCache = superjson.parse(
      window.localStorage.getItem("app-cache") || "[]"
    ) as unknown;
    if (!Array.isArray(savedCache)) {
      console.warn("Invalid cache format", savedCache);
      throw new Error("Invalid cache format");
    }
    return savedCache as [string, object][];
  } catch (e) {
    console.warn("error loading cache. Clearing cache.", e);
    window.localStorage.removeItem("app-cache");
    return [];
  }
}

function saveToLocalStorage(data: [string, object][]) {
  try {
    const appCache = superjson.stringify(data);
    window.localStorage.setItem("app-cache", appCache);
  } catch (e) {
    console.warn("error saving cache. skipping.", e);
  }
}

interface LocalCacheContextType {
  get: (key: string) => object | undefined;
  set: (key: string, value: object) => void;
  isReady: boolean;
}

const LocalCacheContext = createContext<LocalCacheContextType | null>(null);

export function LocalCacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    async function load() {
      const localData = await loadFromLocalStorage();
      for (const [k, v] of localData) {
        cacheRef.current.set(k, v);
      }
      setReady(true);
    }
    load();
  }, []);

  const get = (key: string) => {
    const value = cacheRef.current.get(key);
    cacheRef.current.delete(key);
    return value;
  };
  const set = (key: string, value: object) => {
    cacheRef.current.set(key, value);
    saveToLocalStorage(Array.from(cacheRef.current.entries()));
  };

  // const map = useMemo(() => new Map<string, object>(), []);
  // useEffect(() => {
  //   try {
  //     const savedCache = superjson.parse(
  //       window.localStorage.getItem("app-cache") || "[]"
  //     ) as [string, object][];
  //     savedCache.forEach(([key, value]: [string, object]) => {
  //       map.set(key, value);
  //     });
  //     console.log("map", map);
  //     console.log("cache entries", map.size);

  //     // Before unloading the app, we write back all the data into `localStorage`.
  //     window.addEventListener("beforeunload", () => {
  //       const appCache = superjson.stringify(Array.from(map.entries()));
  //       window.localStorage.setItem("app-cache", appCache);
  //     });
  //   } catch (e) {
  //     window.localStorage.removeItem("app-cache");
  //     console.error("error loading cache. Clearing cache.", e);
  //   }
  // }, [map]);

  // const asyncSave = async () => {
  //   const appCache = superjson.stringify(Array.from(map.entries()));
  //   window.localStorage.setItem("app-cache", appCache);
  // };

  return (
    <LocalCacheContext.Provider value={{ get, set, isReady: ready }}>
      {children}
    </LocalCacheContext.Provider>
  );
}

export const useLocalCache = () => {
  const context = useContext(LocalCacheContext);
  if (!context) {
    throw new Error("useLocalCache must be used within LocalCacheProvider");
  }
  return context;
};
