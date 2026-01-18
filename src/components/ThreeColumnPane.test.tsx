import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import { ThreeColumnPane } from "./ThreeColumnPane.js";
import type { ScopedPermission, ScopeFlags } from "../core/config-types.js";

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

// This is the viewport calculation logic extracted from ThreeColumnPane
function calculateViewport(
  permissions: ScopedPermission[],
  viewportStart: number,
  viewportHeight: number
) {
  const hiddenAbove = viewportStart;
  const viewportEnd = Math.min(viewportStart + viewportHeight, permissions.length);
  const hiddenBelow = Math.max(0, permissions.length - viewportEnd);
  const visiblePermissions = permissions.slice(viewportStart, viewportEnd);

  return {
    hiddenAbove,
    hiddenBelow,
    viewportEnd,
    visiblePermissions,
    visibleCount: visiblePermissions.length,
  };
}

// Check if selectedRow maps to the correct visible index
function getVisibleSelectedIndex(
  selectedRow: number,
  viewportStart: number,
  visibleCount: number
): number | null {
  const visibleIndex = selectedRow - viewportStart;
  if (visibleIndex >= 0 && visibleIndex < visibleCount) {
    return visibleIndex;
  }
  return null; // Selected row is not visible
}

describe("ThreeColumnPane viewport calculations", () => {
  describe("calculateViewport", () => {
    it("should show all items when total < viewportHeight", () => {
      const permissions = generatePermissions(5);
      const result = calculateViewport(permissions, 0, 20);

      expect(result.hiddenAbove).toBe(0);
      expect(result.hiddenBelow).toBe(0);
      expect(result.visibleCount).toBe(5);
    });

    it("should show viewportHeight items when total > viewportHeight at start", () => {
      const permissions = generatePermissions(30);
      const result = calculateViewport(permissions, 0, 20);

      expect(result.hiddenAbove).toBe(0);
      expect(result.hiddenBelow).toBe(10);
      expect(result.visibleCount).toBe(20);
    });

    it("should show correct hidden counts when scrolled", () => {
      const permissions = generatePermissions(30);
      const result = calculateViewport(permissions, 5, 20);

      expect(result.hiddenAbove).toBe(5);
      expect(result.hiddenBelow).toBe(5);
      expect(result.visibleCount).toBe(20);
    });

    it("should handle scrolled to end", () => {
      const permissions = generatePermissions(30);
      const result = calculateViewport(permissions, 10, 20);

      expect(result.hiddenAbove).toBe(10);
      expect(result.hiddenBelow).toBe(0);
      expect(result.visibleCount).toBe(20);
    });

    it("should handle viewportStart beyond valid range", () => {
      const permissions = generatePermissions(30);
      // If viewportStart is 25 and viewportHeight is 20, we can only show 5 items
      const result = calculateViewport(permissions, 25, 20);

      expect(result.hiddenAbove).toBe(25);
      expect(result.hiddenBelow).toBe(0);
      expect(result.visibleCount).toBe(5);
    });
  });

  describe("getVisibleSelectedIndex", () => {
    it("should return 0 when first row selected at start", () => {
      // sel=0, vs=0, vis=20 -> visible index = 0
      const result = getVisibleSelectedIndex(0, 0, 20);
      expect(result).toBe(0);
    });

    it("should return correct index when scrolled", () => {
      // sel=10, vs=5, vis=20 -> visible index = 5
      const result = getVisibleSelectedIndex(10, 5, 20);
      expect(result).toBe(5);
    });

    it("should return null when selection is above viewport", () => {
      // sel=2, vs=5, vis=20 -> selection is above viewport
      const result = getVisibleSelectedIndex(2, 5, 20);
      expect(result).toBeNull();
    });

    it("should return null when selection is below viewport", () => {
      // sel=30, vs=5, vis=20 -> selection is below viewport
      const result = getVisibleSelectedIndex(30, 5, 20);
      expect(result).toBeNull();
    });

    it("should return last visible index when selection at viewport end", () => {
      // sel=24, vs=5, vis=20 -> visible index = 19 (last)
      const result = getVisibleSelectedIndex(24, 5, 20);
      expect(result).toBe(19);
    });
  });

  describe("selection highlighting in visiblePermissions", () => {
    it("should highlight first item when sel=0, vs=0", () => {
      const permissions = generatePermissions(30);
      const selectedRow = 0;
      const viewportStart = 0;
      const viewportHeight = 20;

      const { visiblePermissions } = calculateViewport(permissions, viewportStart, viewportHeight);

      // Check which visible item should be selected
      visiblePermissions.forEach((_, index) => {
        const actualRowIndex = viewportStart + index;
        const isSelected = actualRowIndex === selectedRow;
        if (index === 0) {
          expect(isSelected).toBe(true);
        } else {
          expect(isSelected).toBe(false);
        }
      });
    });

    it("should highlight correct item when sel=1, vs=0", () => {
      const permissions = generatePermissions(30);
      const selectedRow = 1;
      const viewportStart = 0;
      const viewportHeight = 20;

      const { visiblePermissions } = calculateViewport(permissions, viewportStart, viewportHeight);

      visiblePermissions.forEach((_, index) => {
        const actualRowIndex = viewportStart + index;
        const isSelected = actualRowIndex === selectedRow;
        if (index === 1) {
          expect(isSelected).toBe(true);
        } else {
          expect(isSelected).toBe(false);
        }
      });
    });

    it("should highlight first visible item when sel=5, vs=5", () => {
      const permissions = generatePermissions(30);
      const selectedRow = 5;
      const viewportStart = 5;
      const viewportHeight = 20;

      const { visiblePermissions } = calculateViewport(permissions, viewportStart, viewportHeight);

      visiblePermissions.forEach((_, index) => {
        const actualRowIndex = viewportStart + index;
        const isSelected = actualRowIndex === selectedRow;
        // selectedRow=5 should be at visible index 0 when viewportStart=5
        if (index === 0) {
          expect(isSelected).toBe(true);
        } else {
          expect(isSelected).toBe(false);
        }
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty permissions", () => {
      const permissions: ScopedPermission[] = [];
      const result = calculateViewport(permissions, 0, 20);

      expect(result.hiddenAbove).toBe(0);
      expect(result.hiddenBelow).toBe(0);
      expect(result.visibleCount).toBe(0);
    });

    it("should handle viewportHeight of 0", () => {
      const permissions = generatePermissions(10);
      const result = calculateViewport(permissions, 0, 0);

      expect(result.hiddenAbove).toBe(0);
      expect(result.hiddenBelow).toBe(10);
      expect(result.visibleCount).toBe(0);
    });

    it("should handle exact fit (total === viewportHeight)", () => {
      const permissions = generatePermissions(20);
      const result = calculateViewport(permissions, 0, 20);

      expect(result.hiddenAbove).toBe(0);
      expect(result.hiddenBelow).toBe(0);
      expect(result.visibleCount).toBe(20);
    });
  });
});

describe("ThreeColumnPane rendering", () => {
  describe("selector display", () => {
    it("should show selector (▸) on first row when sel=0, vs=0, few items", () => {
      const permissions = generatePermissions(5);
      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={20}
        />
      );

      const output = lastFrame();
      const lines = output?.split("\n") || [];

      // Find lines with permission content (contain "Bash(command-")
      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));

      // Should have 5 permission lines
      expect(permissionLines.length).toBe(5);

      // First permission line should have selector
      expect(permissionLines[0]).toContain("▸");
      expect(permissionLines[0]).toContain("command-000");

      // Other lines should not have selector
      for (let i = 1; i < permissionLines.length; i++) {
        expect(permissionLines[i]).not.toContain("▸");
      }
    });

    it("should show selector on second row when sel=1, vs=0, few items", () => {
      const permissions = generatePermissions(5);
      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={1}
          viewportStart={0}
          viewportHeight={20}
        />
      );

      const output = lastFrame();
      const lines = output?.split("\n") || [];
      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));

      expect(permissionLines.length).toBe(5);

      // First line should NOT have selector
      expect(permissionLines[0]).not.toContain("▸");
      expect(permissionLines[0]).toContain("command-000");

      // Second line should have selector
      expect(permissionLines[1]).toContain("▸");
      expect(permissionLines[1]).toContain("command-001");
    });

    it("should show selector on first row when sel=0, vs=0, many items (30)", () => {
      const permissions = generatePermissions(30);
      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={20}
        />
      );

      const output = lastFrame();
      const lines = output?.split("\n") || [];
      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));

      // Should have 20 permission lines (viewportHeight)
      expect(permissionLines.length).toBe(20);

      // First permission line should have selector and be command-000
      expect(permissionLines[0]).toContain("▸");
      expect(permissionLines[0]).toContain("command-000");

      // Second line should be command-001 without selector
      expect(permissionLines[1]).not.toContain("▸");
      expect(permissionLines[1]).toContain("command-001");
    });

    it("should show selector on second row when sel=1, vs=0, many items (30)", () => {
      const permissions = generatePermissions(30);
      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={1}
          viewportStart={0}
          viewportHeight={20}
        />
      );

      const output = lastFrame();
      const lines = output?.split("\n") || [];
      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));

      expect(permissionLines.length).toBe(20);

      // First line: command-000 without selector
      expect(permissionLines[0]).not.toContain("▸");
      expect(permissionLines[0]).toContain("command-000");

      // Second line: command-001 with selector
      expect(permissionLines[1]).toContain("▸");
      expect(permissionLines[1]).toContain("command-001");
    });
  });

  describe("hidden indicators", () => {
    it("should show hidden below indicator when total > viewportHeight", () => {
      const permissions = generatePermissions(30);
      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={20}
        />
      );

      const output = lastFrame() || "";

      // Should show "10 items below"
      expect(output).toContain("▼");
      expect(output).toContain("10 items below");
    });

    it("should show hidden above indicator when scrolled", () => {
      const permissions = generatePermissions(30);
      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={10}
          viewportStart={5}
          viewportHeight={20}
        />
      );

      const output = lastFrame() || "";

      // Should show "5 items above"
      expect(output).toContain("▲");
      expect(output).toContain("5 items above");
    });

    it("should not show hidden indicators when all items fit", () => {
      const permissions = generatePermissions(5);
      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={20}
        />
      );

      const output = lastFrame() || "";

      expect(output).not.toContain("▲");
      expect(output).not.toContain("▼");
      expect(output).not.toContain("items above");
      expect(output).not.toContain("items below");
    });
  });

  describe("row count verification", () => {
    it("should render exactly viewportHeight rows when total > viewportHeight", () => {
      const permissions = generatePermissions(30);
      const viewportHeight = 20;

      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={viewportHeight}
        />
      );

      const output = lastFrame();
      const lines = output?.split("\n") || [];
      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));

      expect(permissionLines.length).toBe(viewportHeight);
    });

    it("should render all rows when total < viewportHeight", () => {
      const permissions = generatePermissions(5);

      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={20}
        />
      );

      const output = lastFrame();
      const lines = output?.split("\n") || [];
      const permissionLines = lines.filter((line) => line.includes("Bash(command-"));

      expect(permissionLines.length).toBe(5);
    });
  });

  describe("visual inspection", () => {
    // This test outputs the actual rendered frame for visual inspection
    // Run with: pnpm test -- --reporter=verbose
    it("DEBUG: print actual rendered output for 30 items, sel=0, vs=0", () => {
      const permissions = generatePermissions(30);
      const { lastFrame } = render(
        <ThreeColumnPane
          permissions={permissions}
          selectedRow={0}
          viewportStart={0}
          viewportHeight={20}
        />
      );

      const output = lastFrame() || "";
      console.log("\n=== ThreeColumnPane rendered output (30 items, sel=0, vs=0) ===");
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
        console.log(`  [${i}]: ${line}`);
      });

      expect(true).toBe(true); // Always pass, just for output
    });
  });
});
