import {
  useRef,
  useEffect,
  useState,
  useCallback,
  DependencyList,
} from "react";

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  useEffect(() => {
    const endElement = endRef.current;
    const containerElement = containerRef.current;

    if (!endElement || !containerElement) return;

    // This observer checks if the endRef is visible.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      {
        root: containerElement,
        rootMargin: "0px 0px 100px 0px", // Trigger a little before it's fully in view
        threshold: 1.0,
      }
    );

    observer.observe(endElement);

    return () => observer.disconnect();
  }, []);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
  };
}
