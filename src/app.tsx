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

// Layout constants for fixed UI elements (inside the container)
const LAYOUT = {
  // Container padding (inside)
  CONTAINER_PADDING: 2,        // padding={1} adds 1 line top + 1 line bottom

  // Title section
  TITLE_LINES: 1,              // "sync-permissions" text
  TITLE_MARGIN_BOTTOM: 1,      // marginBottom={1}

  // Project tabs (Box with border)
  TABS_BORDER_TOP: 1,
  TABS_CONTENT: 1,
  TABS_BORDER_BOTTOM: 1,
  TABS_MARGIN_BOTTOM: 1,       // marginBottom={1} in ProjectTabs component

  // ThreeColumnPane indicators
  HIDDEN_ABOVE_INDICATOR: 1,
  HIDDEN_BELOW_INDICATOR: 1,

  // StatusBar
  STATUS_MARGIN_TOP: 1,        // marginTop={1} on outer Box
  STATUS_SEPARATOR: 1,         // "───" line
  STATUS_LEGEND: 1,            // "U=User P=Project..."
  STATUS_KEYBINDINGS_1: 1,     // "[↑↓] Navigate..."
  STATUS_KEYBINDINGS_2: 1,     // "[Tab] Switch project..."
  STATUS_MESSAGE_MARGIN_TOP: 1, // marginTop={1} on message Box
  STATUS_MESSAGE: 1,           // "● Unsaved changes" or " "
} as const;

// Fixed lines INSIDE the container (used to calculate viewportHeight)
const FIXED_UI_LINES_INSIDE_CONTAINER =
  LAYOUT.CONTAINER_PADDING +
  LAYOUT.TITLE_LINES +
  LAYOUT.TITLE_MARGIN_BOTTOM +
  LAYOUT.TABS_BORDER_TOP +
  LAYOUT.TABS_CONTENT +
  LAYOUT.TABS_BORDER_BOTTOM +
  LAYOUT.TABS_MARGIN_BOTTOM +
  LAYOUT.HIDDEN_ABOVE_INDICATOR +
  LAYOUT.HIDDEN_BELOW_INDICATOR +
  LAYOUT.STATUS_MARGIN_TOP +
  LAYOUT.STATUS_SEPARATOR +
  LAYOUT.STATUS_LEGEND +
  LAYOUT.STATUS_KEYBINDINGS_1 +
  LAYOUT.STATUS_KEYBINDINGS_2 +
  LAYOUT.STATUS_MESSAGE_MARGIN_TOP +
  LAYOUT.STATUS_MESSAGE;
// Total: 2 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 = 17

const MIN_VIEWPORT_HEIGHT = 3;
const MAX_VIEWPORT_HEIGHT = 20;

export function App({ config }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [confirmQuit, setConfirmQuit] = useState(false);

  // Fixed container height to prevent flicker (stdout.rows - 1 trick from ink#359)
  const terminalHeight = stdout?.rows ?? 24;
  const containerHeight = terminalHeight - 1;

  // Calculate viewport height based on container size (not terminal size)
  // This ensures we don't try to render more rows than the container can fit
  const viewportHeight = useMemo(() => {
    const calculated = containerHeight - FIXED_UI_LINES_INSIDE_CONTAINER;
    return Math.min(MAX_VIEWPORT_HEIGHT, Math.max(MIN_VIEWPORT_HEIGHT, calculated));
  }, [containerHeight]);

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

  // Enable mouse events
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
    <Box flexDirection="column" padding={1} height={containerHeight}>
      {/* Title */}
      <Box marginBottom={1} flexShrink={0}>
        <Text color="cyan" bold>
          sync-permissions
        </Text>
      </Box>

      {/* Project tabs */}
      <Box flexShrink={0}>
        <ProjectTabs projects={projectNames} selectedIndex={nav.selectedProject} />
      </Box>

      {/* Permission list with legend */}
      <ThreeColumnPane
        permissions={displayPermissions}
        selectedRow={nav.selectedRow}
        viewportStart={nav.viewportStart}
        viewportHeight={viewportHeight}
      />

      {/* Status bar */}
      <Box flexShrink={0}>
        <StatusBar hasChanges={state.hasChanges} message={statusMessage} />
      </Box>
    </Box>
  );
}
