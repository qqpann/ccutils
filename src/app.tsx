import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Box, Text, useApp, useStdout } from "ink";
import type { LoadedConfig, ScopedPermission } from "./core/config-types.js";
import { usePermissions, fullPermissionKey } from "./hooks/usePermissions.js";
import { useNavigation } from "./hooks/useNavigation.js";
import { ProjectTabs } from "./components/ProjectTabs.js";
import { ThreeColumnPane } from "./components/ThreeColumnPane.js";
import { StatusBar } from "./components/StatusBar.js";

interface AppProps {
  config: LoadedConfig;
}

// Fixed UI elements take up these lines:
// - Title + margin: 2 lines
// - Project tabs: 1 line
// - Header (USER/PROJECT/LOCAL): 1 line
// - Separator: 1 line
// - Status bar: 2 lines
// - Hidden items indicators (top/bottom): 2 lines
// - Padding: 2 lines (top/bottom)
const FIXED_UI_LINES = 11;
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

  // Use ref to store nav state and permissions for handlers
  const navRef = useRef({ selectedProject: 0, selectedRow: 0, viewportStart: 0 });
  const permissionsRef = useRef<ScopedPermission[]>([]);

  const {
    state,
    getProjectPermissions,
    promotePermission,
    demotePermission,
    save,
  } = usePermissions(config);

  // Get current project's permissions
  const projectNames = useMemo(
    () => state.projects.map((p) => p.name),
    [state.projects]
  );

  // Navigation handlers using ref
  const handlePromote = useCallback(() => {
    const { selectedProject, selectedRow } = navRef.current;
    const perm = permissionsRef.current[selectedRow];
    if (perm) {
      promotePermission(selectedProject, fullPermissionKey(perm));
    }
    setStatusMessage(undefined);
    setConfirmQuit(false);
  }, [promotePermission]);

  const handleDemote = useCallback(() => {
    const { selectedProject, selectedRow } = navRef.current;
    const perm = permissionsRef.current[selectedRow];
    if (perm) {
      demotePermission(selectedProject, fullPermissionKey(perm));
    }
    setStatusMessage(undefined);
    setConfirmQuit(false);
  }, [demotePermission]);

  const handleSave = useCallback(() => {
    save(config.userSettingsPath);
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
  const { nav, setRowCount } = useNavigation(
    state.projects.length,
    {
      onPromote: handlePromote,
      onDemote: handleDemote,
      onSave: handleSave,
      onQuit: handleQuit,
    },
    viewportHeight
  );

  // Keep ref in sync with nav state
  navRef.current = nav;

  // Get permissions for the currently selected project (already sorted in getProjectPermissions)
  const displayPermissions = useMemo(
    () => getProjectPermissions(nav.selectedProject),
    [getProjectPermissions, nav.selectedProject]
  );

  // Keep permissions ref in sync
  permissionsRef.current = displayPermissions;

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

      {/* Three-column pane */}
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
