import React from "react";
import { Box, Text } from "ink";
import type { ScopedPermission } from "../core/config-types.js";
import { PermissionRow } from "./PermissionRow.js";

interface ThreeColumnPaneProps {
  permissions: ScopedPermission[];
  selectedRow: number;
  viewportStart: number;
  viewportHeight: number;
}

export function ThreeColumnPane({
  permissions,
  selectedRow,
  viewportStart,
  viewportHeight,
}: ThreeColumnPaneProps) {
  // Calculate hidden items
  const hiddenAbove = viewportStart;
  const viewportEnd = Math.min(viewportStart + viewportHeight, permissions.length);
  const hiddenBelow = Math.max(0, permissions.length - viewportEnd);

  // Get visible permissions
  const visiblePermissions = permissions.slice(viewportStart, viewportEnd);

  // Calculate fixed height for consistent rendering
  // indicator lines(2) + viewport rows
  const fixedHeight = 2 + viewportHeight;

  return (
    <Box flexDirection="column" height={fixedHeight}>
      {/* Hidden above indicator */}
      {hiddenAbove > 0 ? (
        <Text color="gray">
          {"  "}▲ {hiddenAbove} item{hiddenAbove > 1 ? "s" : ""} hidden
        </Text>
      ) : (
        <Text> </Text>
      )}

      {/* Permission rows */}
      {permissions.length === 0 ? (
        <Box paddingY={1}>
          <Text color="gray" italic>
            No permissions configured
          </Text>
        </Box>
      ) : (
        visiblePermissions.map((perm, index) => (
          <PermissionRow
            key={`${viewportStart + index}:${perm.type}:${perm.rule}`}
            permission={perm}
            isSelected={viewportStart + index === selectedRow}
          />
        ))
      )}

      {/* Hidden below indicator */}
      {hiddenBelow > 0 ? (
        <Text color="gray">
          {"  "}▼ {hiddenBelow} item{hiddenBelow > 1 ? "s" : ""} hidden
        </Text>
      ) : (
        <Text> </Text>
      )}
    </Box>
  );
}
