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
  // Permission order is fixed at load time and never changes
  // Only the scope property changes when promoting/demoting
  const separator = `${"═".repeat(COLUMN_WIDTH)}╪${"═".repeat(COLUMN_WIDTH)}╪${"═".repeat(COLUMN_WIDTH)}`;

  return (
    <Box flexDirection="column">
      <Text>
        <Text color="cyan" bold>{"USER (global)".padEnd(COLUMN_WIDTH)}</Text>
        <Text color="gray">│</Text>
        <Text color="cyan" bold>{"PROJECT".padEnd(COLUMN_WIDTH)}</Text>
        <Text color="gray">│</Text>
        <Text color="cyan" bold>{"LOCAL".padEnd(COLUMN_WIDTH)}</Text>
      </Text>
      <Text color="gray">{separator}</Text>

      {/* Permission rows */}
      {permissions.length === 0 ? (
        <Box paddingY={1}>
          <Text color="gray" italic>
            No permissions configured
          </Text>
        </Box>
      ) : (
        permissions.map((perm, index) => (
          <PermissionRow
            key={`${perm.scope}:${perm.type}:${perm.rule}`}
            permission={perm}
            isSelected={index === selectedRow}
          />
        ))
      )}
    </Box>
  );
}
