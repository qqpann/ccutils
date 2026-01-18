import { useState, useRef, useEffect, useCallback } from "react";
import { useInput } from "ink";

export interface NavigationState {
  selectedProject: number;
  selectedRow: number;
  viewportStart: number;
}

export interface NavigationHandlers {
  onPromote: () => void;
  onDemote: () => void;
  onSave: () => void;
  onQuit: () => void;
}

export function useNavigation(
  projectCount: number,
  handlers: NavigationHandlers,
  viewportHeight: number = 10
) {
  const [nav, setNav] = useState<NavigationState>({
    selectedProject: 0,
    selectedRow: 0,
    viewportStart: 0,
  });

  // Keep viewportHeight in ref
  const viewportHeightRef = useRef(viewportHeight);

  // Use refs to avoid stale closures
  const projectCountRef = useRef(projectCount);
  const rowCountRef = useRef(0);
  const handlersRef = useRef(handlers);

  // Keep refs in sync
  useEffect(() => {
    projectCountRef.current = projectCount;
    handlersRef.current = handlers;
    viewportHeightRef.current = viewportHeight;
  }, [projectCount, handlers, viewportHeight]);

  // Update row count from outside (called by parent) - stable reference
  const setRowCount = useCallback((count: number) => {
    if (rowCountRef.current === count) return; // Skip if unchanged
    rowCountRef.current = count;
    // Clamp current selection and adjust viewport if needed
    setNav((prev) => {
      const newRow = Math.min(prev.selectedRow, Math.max(0, count - 1));
      // Ensure viewportStart is valid for new count
      const maxViewportStart = Math.max(0, count - viewportHeightRef.current);
      let newViewportStart = Math.min(prev.viewportStart, maxViewportStart);
      // Ensure selected row is visible
      if (newRow < newViewportStart) {
        newViewportStart = newRow;
      } else if (newRow >= newViewportStart + viewportHeightRef.current) {
        newViewportStart = newRow - viewportHeightRef.current + 1;
      }
      if (newRow === prev.selectedRow && newViewportStart === prev.viewportStart) {
        return prev;
      }
      return { ...prev, selectedRow: newRow, viewportStart: newViewportStart };
    });
  }, []);

  // Handle keyboard input
  useInput((input, key) => {
    if (key.upArrow) {
      // Move up with viewport adjustment
      setNav((prev) => {
        const newRow = Math.max(0, prev.selectedRow - 1);
        let newViewportStart = prev.viewportStart;
        // Scroll viewport up if selection goes above it
        if (newRow < newViewportStart) {
          newViewportStart = newRow;
        }
        return { ...prev, selectedRow: newRow, viewportStart: newViewportStart };
      });
    } else if (key.downArrow) {
      // Move down with viewport adjustment
      setNav((prev) => {
        const newRow = Math.min(
          Math.max(0, rowCountRef.current - 1),
          prev.selectedRow + 1
        );
        let newViewportStart = prev.viewportStart;
        // Scroll viewport down if selection goes below it
        if (newRow >= newViewportStart + viewportHeightRef.current) {
          newViewportStart = newRow - viewportHeightRef.current + 1;
        }
        return { ...prev, selectedRow: newRow, viewportStart: newViewportStart };
      });
    } else if (key.leftArrow) {
      handlersRef.current.onPromote();
    } else if (key.rightArrow) {
      handlersRef.current.onDemote();
    } else if (key.tab) {
      if (key.shift) {
        // Previous project
        setNav((prev) => ({
          selectedProject:
            (prev.selectedProject - 1 + Math.max(1, projectCountRef.current)) %
            Math.max(1, projectCountRef.current),
          selectedRow: 0,
          viewportStart: 0,
        }));
      } else {
        // Next project
        setNav((prev) => ({
          selectedProject:
            (prev.selectedProject + 1) % Math.max(1, projectCountRef.current),
          selectedRow: 0,
          viewportStart: 0,
        }));
      }
    } else if (key.return) {
      handlersRef.current.onSave();
    } else if (input === "q" || input === "Q") {
      handlersRef.current.onQuit();
    }
  });

  return {
    nav,
    setNav,
    setRowCount,
  };
}
