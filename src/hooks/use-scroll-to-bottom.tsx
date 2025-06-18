import { useRef, useEffect, useState, useCallback } from "react";

type ScrollAction =
  | { type: "instant"; target: "bottom" }
  | { type: "smooth"; target: "bottom" }
  | { type: "smooth"; target: "last-user-message" }
  | null;

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [scrollAction, setScrollAction] = useState<ScrollAction>(null);

  // Execute scroll actions when they're requested
  useEffect(() => {
    if (!scrollAction) return;

    const executeScroll = () => {
      const container = containerRef.current;
      const end = endRef.current;

      if (!container || !end) return;

      switch (scrollAction.type) {
        case "instant":
          if (scrollAction.target === "bottom") {
            end.scrollIntoView({ behavior: "instant" });
          }
          break;

        case "smooth":
          if (scrollAction.target === "bottom") {
            end.scrollIntoView({ behavior: "smooth" });
          } else if (scrollAction.target === "last-user-message") {
            // Find the last user message and scroll it to viewport top
            const userMessages = container.querySelectorAll(
              '[data-message-role="user"]'
            );
            const lastUserMessage = userMessages[
              userMessages.length - 1
            ] as HTMLElement;

            if (lastUserMessage) {
              lastUserMessage.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            } else {
              // Fallback: scroll to bottom if no user message found
              end.scrollIntoView({ behavior: "smooth" });
            }
          }
          break;
      }
    };

    // Execute scroll in next frame to ensure DOM is ready
    requestAnimationFrame(executeScroll);

    // Clear the action after executing
    setScrollAction(null);
  }, [scrollAction]);

  // Scroll to bottom instantly (for thread switching)
  const scrollToBottomInstant = useCallback(() => {
    setScrollAction({ type: "instant", target: "bottom" });
  }, []);

  // Scroll to bottom smoothly (for manual button)
  const scrollToBottom = useCallback(() => {
    setScrollAction({ type: "smooth", target: "bottom" });
  }, []);

  // Viewport callbacks for intersection observer
  const onViewportEnter = useCallback(() => {
    setIsAtBottom(true);
  }, []);

  const onViewportLeave = useCallback(() => {
    setIsAtBottom(false);
  }, []);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    scrollToBottomInstant,
    onViewportEnter,
    onViewportLeave,
  };
}
