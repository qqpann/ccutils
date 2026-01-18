import { useState, useRef, useEffect } from "react";
import { useInput } from "ink";

export interface NavigationState {
  selectedProject: number;
  selectedRow: number;
}

export interface NavigationHandlers {
  onPromote: () => void;
  onDemote: () => void;
  onSave: () => void;
  onQuit: () => void;
}

export function useNavigation(
  projectCount: number,
  handlers: NavigationHandlers
) {
  const [nav, setNav] = useState<NavigationState>({
    selectedProject: 0,
    selectedRow: 0,
  });

  // Use refs to avoid stale closures
  const projectCountRef = useRef(projectCount);
  const rowCountRef = useRef(0);
  const handlersRef = useRef(handlers);

  // Keep refs in sync
  useEffect(() => {
    projectCountRef.current = projectCount;
    handlersRef.current = handlers;
  }, [projectCount, handlers]);

  // Update row count from outside (called by parent)
  const setRowCount = (count: number) => {
    rowCountRef.current = count;
    // Clamp current selection if needed
    setNav((prev) => ({
      ...prev,
      selectedRow: Math.min(prev.selectedRow, Math.max(0, count - 1)),
    }));
  };

  // Handle keyboard input
  useInput((input, key) => {
    if (key.upArrow) {
      // Move up
      setNav((prev) => ({
        ...prev,
        selectedRow: Math.max(0, prev.selectedRow - 1),
      }));
    } else if (key.downArrow) {
      // Move down
      setNav((prev) => ({
        ...prev,
        selectedRow: Math.min(
          Math.max(0, rowCountRef.current - 1),
          prev.selectedRow + 1
        ),
      }));
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
        }));
      } else {
        // Next project
        setNav((prev) => ({
          selectedProject:
            (prev.selectedProject + 1) % Math.max(1, projectCountRef.current),
          selectedRow: 0,
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
