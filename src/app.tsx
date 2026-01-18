import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Box, Text, useApp, useStdout } from "ink";
import type { LoadedConfig, PermissionScope } from "./core/config-types.js";
import { usePermissions } from "./hooks/usePermissions.js";
import { useNavigation } from "./hooks/useNavigation.js";
import { useMouseEvents } from "./hooks/useMouseEvents.js";
import { ProjectTabs } from "./components/ProjectTabs.js";
import { ThreeColumnPane } from "./components/ThreeColumnPane.js";
import { StatusBar } from "./components/StatusBar.js";

interface AppProps {
  config: LoadedConfig;
}

// Fixed UI elements take up these lines:
// - Title + margin: 2 lines
// - Project tabs: 1 line
// - Status bar: 3 lines (separator + legend + key bindings)
// - Hidden items indicators (top/bottom): 2 lines
// - Padding: 2 lines (top/bottom)
const FIXED_UI_LINES = 10;
const MIN_VIEWPORT_HEIGHT = 3;
const MAX_VIEWPORT_HEIGHT = 20;

export function App({ config }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [confirmQuit, setConfirmQuit] = useState(false);

  // Calculate viewport height from terminal size
  const viewportHeight = useMemo(() => {
    const terminalHeight = stdout?.rows ?? 24;
    const calculated = terminalHeight - FIXED_UI_LINES;
    return Math.min(MAX_VIEWPORT_HEIGHT, Math.max(MIN_VIEWPORT_HEIGHT, calculated));
  }, [stdout?.rows]);

  // Use ref to store nav state for handlers
  const navRef = useRef({ selectedProject: 0, selectedRow: 0, viewportStart: 0 });

  const {
    state,
    getProjectPermissions,
    toggleScope,
    moveLeft,
    moveRight,
    deletePermission,
    save,
  } = usePermissions(config);

  // Get current project's permissions
  const projectNames = useMemo(
    () => state.projects.map((p) => p.name),
    [state.projects]
  );

  // Navigation handlers using ref
  const handleMoveLeft = useCallback(() => {
    const { selectedProject, selectedRow } = navRef.current;
    moveLeft(selectedProject, selectedRow);
    setStatusMessage(undefined);
    setConfirmQuit(false);
  }, [moveLeft]);

  const handleMoveRight = useCallback(() => {
    const { selectedProject, selectedRow } = navRef.current;
    moveRight(selectedProject, selectedRow);
    setStatusMessage(undefined);
    setConfirmQuit(false);
  }, [moveRight]);

  const handleToggleScope = useCallback((scope: PermissionScope) => {
    const { selectedProject, selectedRow } = navRef.current;
    toggleScope(selectedProject, selectedRow, scope);
    setStatusMessage(undefined);
    setConfirmQuit(false);
  }, [toggleScope]);

  const handleDelete = useCallback(() => {
    const { selectedProject, selectedRow } = navRef.current;
    deletePermission(selectedProject, selectedRow);
    setStatusMessage(undefined);
    setConfirmQuit(false);
  }, [deletePermission]);

  const handleSave = useCallback(async () => {
    await save(config.userSettingsPath);
    setStatusMessage("✓ Saved");
    setConfirmQuit(false);
    // Clear message after 2 seconds
    setTimeout(() => setStatusMessage(undefined), 2000);
  }, [save, config.userSettingsPath]);

  const handleQuit = useCallback(() => {
    if (state.hasChanges && !confirmQuit) {
      setConfirmQuit(true);
      setStatusMessage("Unsaved changes. Press q again to quit.");
    } else {
      exit();
    }
  }, [state.hasChanges, confirmQuit, exit]);

  // Navigation hook
  const { nav, setNav, setRowCount, scrollUp, scrollDown } = useNavigation(
    state.projects.length,
    {
      onMoveLeft: handleMoveLeft,
      onMoveRight: handleMoveRight,
      onToggleScope: handleToggleScope,
      onDelete: handleDelete,
      onSave: handleSave,
      onQuit: handleQuit,
    },
    viewportHeight
  );

  // Calculate tab bounds for hit testing
  const tabBounds = useMemo(() => {
    const bounds: Array<{ start: number; end: number }> = [];
    // Account for Box padding={1} (adds 1 char on left)
    let x = 1;
    for (const name of projectNames) {
      // Each tab: border(1) + paddingX(1) + marker(2) + name + space(1) + paddingX(1) + border(1)
      // Plus gap(1) between tabs
      const width = 1 + 1 + 2 + name.length + 1 + 1 + 1;
      bounds.push({ start: x, end: x + width - 1 });
      x += width + 1; // +1 for gap
    }
    return bounds;
  }, [projectNames]);

  // Handle mouse click on tabs
  const handleTabClick = useCallback(
    (pos: { x: number; y: number }) => {
      // Tab area spans 3 rows (border-top, content, border-bottom)
      // Layout: padding(1) + title(1) + marginBottom(1) = 3, then tab starts at y=4,5,6
      const tabRowStart = 4;
      const tabRowEnd = 6;
      if (pos.y < tabRowStart || pos.y > tabRowEnd) return;

      // Find which tab was clicked
      const clickedIndex = tabBounds.findIndex(
        (bounds) => pos.x >= bounds.start && pos.x <= bounds.end
      );
      if (clickedIndex !== -1 && clickedIndex !== nav.selectedProject) {
        setNav({
          selectedProject: clickedIndex,
          selectedRow: 0,
          viewportStart: 0,
        });
      }
    },
    [tabBounds, nav.selectedProject, setNav]
  );

  // Enable mouse events (scroll + click)
  useMouseEvents({
    onScrollUp: scrollUp,
    onScrollDown: scrollDown,
    onClick: handleTabClick,
  });

  // Keep ref in sync with nav state
  navRef.current = nav;

  // Get permissions for the currently selected project
  const displayPermissions = useMemo(
    () => getProjectPermissions(nav.selectedProject),
    [getProjectPermissions, nav.selectedProject]
  );

  // Update row count when permissions change
  useEffect(() => {
    setRowCount(displayPermissions.length);
  }, [displayPermissions.length, setRowCount]);

  if (state.projects.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">
          No projects with .claude directory found in the specified paths
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Title */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          sync-permissions
        </Text>
      </Box>

      {/* Project tabs */}
      <ProjectTabs projects={projectNames} selectedIndex={nav.selectedProject} />

      {/* Permission list with legend */}
      <ThreeColumnPane
        permissions={displayPermissions}
        selectedRow={nav.selectedRow}
        viewportStart={nav.viewportStart}
        viewportHeight={viewportHeight}
      />

      {/* Status bar */}
      <StatusBar hasChanges={state.hasChanges} message={statusMessage} />
    </Box>
  );
}
