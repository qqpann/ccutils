import React from "react";
import { Box, Text } from "ink";
import type { ScopedPermission } from "../core/config-types.js";
import { PermissionRow } from "./PermissionRow.js";

interface ThreeColumnPaneProps {
  permissions: ScopedPermission[];
  selectedRow: number;
}

const COLUMN_WIDTH = 24;

export function ThreeColumnPane({
  permissions,
  selectedRow,
}: ThreeColumnPaneProps) {
  // Sort permissions: local at top, then project, then user (for intuitive promote = move down)
  const sortedPermissions = [...permissions].sort((a, b) => {
    const order = { local: 0, project: 1, user: 2 };
    return order[a.scope] - order[b.scope];
  });

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Box width={COLUMN_WIDTH}>
          <Text color="cyan" bold>
            {"USER (共通)".padEnd(COLUMN_WIDTH)}
          </Text>
        </Box>
        <Text color="gray">│</Text>
        <Box width={COLUMN_WIDTH}>
          <Text color="cyan" bold>
            {"PROJECT".padEnd(COLUMN_WIDTH)}
          </Text>
        </Box>
        <Text color="gray">│</Text>
        <Box width={COLUMN_WIDTH}>
          <Text color="cyan" bold>
            {"LOCAL".padEnd(COLUMN_WIDTH)}
          </Text>
        </Box>
      </Box>

      {/* Separator */}
      <Box>
        <Text color="gray">
          {"═".repeat(COLUMN_WIDTH)}╪{"═".repeat(COLUMN_WIDTH)}╪
          {"═".repeat(COLUMN_WIDTH)}
        </Text>
      </Box>

      {/* Permission rows */}
      {sortedPermissions.length === 0 ? (
        <Box paddingY={1}>
          <Text color="gray" italic>
            No permissions configured
          </Text>
        </Box>
      ) : (
        sortedPermissions.map((perm, index) => (
          <PermissionRow
            key={`${perm.scope}:${perm.type}:${perm.rule}`}
            permission={perm}
            isSelected={index === selectedRow}
            rowIndex={index}
          />
        ))
      )}
    </Box>
  );
}
