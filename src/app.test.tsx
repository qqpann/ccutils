import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import { Box, Text } from "ink";
import type { ScopedPermission, ScopeFlags } from "./core/config-types.js";
import { ThreeColumnPane } from "./components/ThreeColumnPane.js";
import { StatusBar } from "./components/StatusBar.js";
import { ProjectTabs } from "./components/ProjectTabs.js";

// Helper to create ScopeFlags
function makeScopes(user: boolean, project: boolean, local: boolean): ScopeFlags {
  return { user, project, local };
}

// Helper to create a permission
function makePerm(rule: string, type: "allow" | "deny" = "allow"): ScopedPermission {
  const scopes = makeScopes(false, false, true);
  return { rule, type, scopes, originalScopes: { ...scopes } };
}

// Generate N permissions for testing
function generatePermissions(count: number): ScopedPermission[] {
  return Array.from({ length: count }, (_, i) =>
    makePerm(`Bash(command-${i.toString().padStart(3, "0")}:*)`)
  );
}

// Layout constants (same as app.tsx)
const LAYOUT = {
  CONTAINER_PADDING: 2,
  TITLE_LINES: 1,
  TITLE_MARGIN_BOTTOM: 1,
  TABS_BORDER_TOP: 1,
  TABS_CONTENT: 1,
  TABS_BORDER_BOTTOM: 1,
  TABS_MARGIN_BOTTOM: 1,
  HIDDEN_ABOVE_INDICATOR: 1,
  HIDDEN_BELOW_INDICATOR: 1,
  STATUS_MARGIN_TOP: 1,
  STATUS_SEPARATOR: 1,
  STATUS_LEGEND: 1,
  STATUS_KEYBINDINGS_1: 1,
  STATUS_KEYBINDINGS_2: 1,
  STATUS_MESSAGE_MARGIN_TOP: 1,
  STATUS_MESSAGE: 1,
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
// Total: 17

// Simplified App layout for testing (without hooks)
function TestAppLayout({
  permissions,
  selectedRow,
  viewportStart,
  viewportHeight,
  containerHeight,
}: {
  permissions: ScopedPermission[];
  selectedRow: number;
  viewportStart: number;
  viewportHeight: number;
  containerHeight: number;
}) {
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
        <ProjectTabs projects={["project-a", "project-b", "project-c"]} selectedIndex={0} />
      </Box>

      {/* Permission list */}
      <ThreeColumnPane
        permissions={permissions}
        selectedRow={selectedRow}
        viewportStart={viewportStart}
        viewportHeight={viewportHeight}
      />

      {/* Status bar */}
      <Box flexShrink={0}>
        <StatusBar hasChanges={false} message={undefined} />
      </Box>
    </Box>
  );
}

describe("App layout rendering", () => {
  describe("with fixed container height (simulating terminal)", () => {
    it("DEBUG: render full app layout with 30 items", () => {
      const permissions = generatePermissions(30);
      const terminalHeight = 40;
      const containerHeight = terminalHeight - 1; // stdout.rows - 1 trick
      const viewportHeight = Math.min(20, containerHeight - FIXED_UI_LINES_INSIDE_CONTAINER);

      console.log(`\n=== Layout calculation ===`);
      console.log(`terminalHeight: ${terminalHeight}`);
      console.log(`containerHeight: ${containerHeight}`);
      console.log(`FIXED_UI_LINES_INSIDE_CONTAINER: ${FIXED_UI_LINES_INSIDE_CONTAINER}`);
      console.log(`viewportHeight: ${viewportHeight}`);

      const { lastFrame } = render(
        <TestAppLayout
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={viewportHeight}
          containerHeight={containerHeight}
        />
      );

      const output = lastFrame() || "";
      console.log("\n=== Full App Layout rendered output ===");
      console.log(output);
      console.log("=== End of output ===\n");

      // Count lines
      const lines = output.split("\n");
      console.log(`Total lines: ${lines.length}`);

      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));
      console.log(`Permission lines: ${permissionLines.length}`);

      // Show first 3 permission lines
      console.log("\nFirst 3 permission lines:");
      permissionLines.slice(0, 3).forEach((line, i) => {
        console.log(`  [${i}]: "${line}"`);
      });

      // Check if first permission line has selector
      if (permissionLines.length > 0) {
        const hasSelector = permissionLines[0].includes("▸");
        console.log(`\nFirst permission line has selector: ${hasSelector}`);
      }

      expect(true).toBe(true);
    });

    it("should show selector on first row in full app layout", () => {
      const permissions = generatePermissions(30);
      const terminalHeight = 40;
      const containerHeight = terminalHeight - 1;
      const viewportHeight = Math.min(20, containerHeight - FIXED_UI_LINES_INSIDE_CONTAINER);

      const { lastFrame } = render(
        <TestAppLayout
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={viewportHeight}
          containerHeight={containerHeight}
        />
      );

      const output = lastFrame() || "";
      const lines = output.split("\n");
      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));

      // First permission line should have selector
      expect(permissionLines[0]).toContain("▸");
      expect(permissionLines[0]).toContain("command-000");
    });

    it("should show correct number of permission rows", () => {
      const permissions = generatePermissions(30);
      const terminalHeight = 40;
      const containerHeight = terminalHeight - 1;
      const viewportHeight = Math.min(20, containerHeight - FIXED_UI_LINES_INSIDE_CONTAINER);

      const { lastFrame } = render(
        <TestAppLayout
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={viewportHeight}
          containerHeight={containerHeight}
        />
      );

      const output = lastFrame() || "";
      const lines = output.split("\n");
      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));

      expect(permissionLines.length).toBe(viewportHeight);
    });
  });

  describe("small terminal height simulation", () => {
    it("DEBUG: render with terminal height 37 (like user's environment)", () => {
      const permissions = generatePermissions(99);
      const terminalHeight = 37;
      const containerHeight = terminalHeight - 1;
      const viewportHeight = Math.min(20, containerHeight - FIXED_UI_LINES_INSIDE_CONTAINER);

      console.log(`\n=== Small terminal simulation ===`);
      console.log(`terminalHeight: ${terminalHeight}`);
      console.log(`containerHeight: ${containerHeight}`);
      console.log(`FIXED_UI_LINES_INSIDE_CONTAINER: ${FIXED_UI_LINES_INSIDE_CONTAINER}`);
      console.log(`viewportHeight: ${viewportHeight}`);
      console.log(`Available for content: ${containerHeight - FIXED_UI_LINES_INSIDE_CONTAINER}`);

      const { lastFrame } = render(
        <TestAppLayout
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={viewportHeight}
          containerHeight={containerHeight}
        />
      );

      const output = lastFrame() || "";
      console.log("\n=== Small terminal App Layout ===");
      console.log(output);
      console.log("=== End of output ===\n");

      const lines = output.split("\n");
      console.log(`Total lines: ${lines.length}`);

      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));
      console.log(`Permission lines: ${permissionLines.length}`);
      console.log(`Expected viewportHeight: ${viewportHeight}`);

      // First 3 permission lines
      console.log("\nFirst 3 permission lines:");
      permissionLines.slice(0, 3).forEach((line, i) => {
        console.log(`  [${i}]: "${line}"`);
      });

      expect(true).toBe(true);
    });
  });
});
