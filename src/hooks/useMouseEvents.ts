import { useEffect, useCallback, useRef } from "react";
import { useStdin } from "ink";

interface MousePosition {
  x: number;
  y: number;
}

interface MouseEventsOptions {
  onScrollUp?: () => void;
  onScrollDown?: () => void;
  onClick?: (pos: MousePosition) => void;
}

/**
 * Enable mouse event support in terminal.
 *
 * This hook enables terminal mouse tracking (SGR extended mode)
 * and parses mouse wheel and click events from stdin.
 *
 * SGR mode button codes:
 * - 0: Left click
 * - 1: Middle click
 * - 2: Right click
 * - 64: Scroll up
 * - 65: Scroll down
 */
export function useMouseEvents({
  onScrollUp,
  onScrollDown,
  onClick,
}: MouseEventsOptions) {
  const { stdin, setRawMode } = useStdin();
  const handlersRef = useRef({ onScrollUp, onScrollDown, onClick });

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = { onScrollUp, onScrollDown, onClick };
  }, [onScrollUp, onScrollDown, onClick]);

  const handleData = useCallback((data: Buffer) => {
    const str = data.toString();

    // SGR extended mouse mode: \x1b[<button;x;yM (press) or \x1b[<button;x;ym (release)
    const sgrMatch = str.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
    if (sgrMatch) {
      const button = parseInt(sgrMatch[1], 10);
      const x = parseInt(sgrMatch[2], 10);
      const y = parseInt(sgrMatch[3], 10);
      const isPress = sgrMatch[4] === "M";

      // Scroll events only - ignore other events to prevent flicker
      if (button === 64) {
        handlersRef.current.onScrollUp?.();
      } else if (button === 65) {
        handlersRef.current.onScrollDown?.();
      } else if (button === 0 && isPress) {
        // Left click - only call handler, don't trigger unnecessary renders
        handlersRef.current.onClick?.({ x, y });
      }
      // Ignore all other mouse events (movement, other buttons, releases)
      return;
    }

    // Legacy X10/Normal mouse mode fallback
    if (str.startsWith("\x1b[M") && str.length >= 6) {
      const button = str.charCodeAt(3);
      const x = str.charCodeAt(4) - 32;
      const y = str.charCodeAt(5) - 32;

      if (button === 96) {
        handlersRef.current.onScrollUp?.();
      } else if (button === 97) {
        handlersRef.current.onScrollDown?.();
      } else if (button === 32) {
        // Left click in legacy mode
        handlersRef.current.onClick?.({ x, y });
      }
    }
  }, []);

  useEffect(() => {
    if (!stdin) return;

    // Enable SGR extended mouse mode
    // \x1b[?1000h - Enable mouse tracking
    // \x1b[?1006h - Enable SGR extended mode
    process.stdout.write("\x1b[?1000h\x1b[?1006h");

    if (setRawMode) {
      setRawMode(true);
    }

    stdin.on("data", handleData);

    return () => {
      stdin.off("data", handleData);
      // Disable mouse tracking on cleanup
      process.stdout.write("\x1b[?1006l\x1b[?1000l");
    };
  }, [stdin, setRawMode, handleData]);
}
