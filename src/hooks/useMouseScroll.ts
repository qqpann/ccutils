import { useEffect, useCallback, useRef } from "react";
import { useStdin } from "ink";

interface MouseScrollOptions {
  onScrollUp: () => void;
  onScrollDown: () => void;
}

/**
 * Enable mouse scroll support in terminal.
 *
 * This hook enables terminal mouse tracking (SGR extended mode)
 * and parses mouse wheel events from stdin.
 */
export function useMouseScroll({ onScrollUp, onScrollDown }: MouseScrollOptions) {
  const { stdin, setRawMode } = useStdin();
  const handlersRef = useRef({ onScrollUp, onScrollDown });

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = { onScrollUp, onScrollDown };
  }, [onScrollUp, onScrollDown]);

  const handleData = useCallback((data: Buffer) => {
    const str = data.toString();

    // SGR extended mouse mode: \x1b[<button;x;yM or \x1b[<button;x;ym
    // Scroll up: button = 64, Scroll down: button = 65
    const sgrMatch = str.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
    if (sgrMatch) {
      const button = parseInt(sgrMatch[1], 10);
      // Button 64 = scroll up, Button 65 = scroll down
      if (button === 64) {
        handlersRef.current.onScrollUp();
      } else if (button === 65) {
        handlersRef.current.onScrollDown();
      }
      return;
    }

    // Legacy X10/Normal mouse mode: \x1b[M followed by 3 bytes
    // Byte 1: button (32 + button code), Byte 2: x+32, Byte 3: y+32
    // Scroll up: button = 96 (32 + 64), Scroll down: button = 97 (32 + 65)
    if (str.startsWith("\x1b[M") && str.length >= 6) {
      const button = str.charCodeAt(3);
      if (button === 96) {
        handlersRef.current.onScrollUp();
      } else if (button === 97) {
        handlersRef.current.onScrollDown();
      }
    }
  }, []);

  useEffect(() => {
    if (!stdin) return;

    // Enable SGR extended mouse mode (better support for modern terminals)
    // \x1b[?1000h - Enable mouse tracking
    // \x1b[?1006h - Enable SGR extended mode
    process.stdout.write("\x1b[?1000h\x1b[?1006h");

    // Ensure raw mode is enabled
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
