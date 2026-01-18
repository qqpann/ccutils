import React from "react";
import { Box, Text } from "ink";
import type { ScopedPermission, PermissionScope } from "../core/config-types.js";

interface PermissionRowProps {
  permission: ScopedPermission;
  isSelected: boolean;
  rowIndex: number;
}

const COLUMN_WIDTH = 24;

function formatPermission(perm: ScopedPermission): string {
  const prefix = perm.type === "allow" ? "○ allow" : "● deny";
  return `${prefix} ${perm.rule}`;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function PermissionRow({
  permission,
  isSelected,
  rowIndex,
}: PermissionRowProps) {
  const formattedPerm = formatPermission(permission);
  const displayText = truncate(formattedPerm, COLUMN_WIDTH - 2);

  // Determine which column to display in
  const columns: Record<PermissionScope, string> = {
    user: "",
    project: "",
    local: "",
  };
  columns[permission.scope] = displayText;

  const bgColor = isSelected ? "blue" : undefined;
  const textColor = permission.type === "allow" ? "green" : "red";

  return (
    <Box>
      {/* User column */}
      <Box width={COLUMN_WIDTH}>
        <Text backgroundColor={isSelected && permission.scope === "user" ? bgColor : undefined}>
          {permission.scope === "user" ? (
            <Text color={textColor}>{columns.user.padEnd(COLUMN_WIDTH)}</Text>
          ) : (
            <Text>{" ".repeat(COLUMN_WIDTH)}</Text>
          )}
        </Text>
      </Box>

      <Text color="gray">│</Text>

      {/* Project column */}
      <Box width={COLUMN_WIDTH}>
        <Text backgroundColor={isSelected && permission.scope === "project" ? bgColor : undefined}>
          {permission.scope === "project" ? (
            <Text color={textColor}>{columns.project.padEnd(COLUMN_WIDTH)}</Text>
          ) : (
            <Text>{" ".repeat(COLUMN_WIDTH)}</Text>
          )}
        </Text>
      </Box>

      <Text color="gray">│</Text>

      {/* Local column */}
      <Box width={COLUMN_WIDTH}>
        <Text backgroundColor={isSelected && permission.scope === "local" ? bgColor : undefined}>
          {permission.scope === "local" ? (
            <Text color={textColor}>{columns.local.padEnd(COLUMN_WIDTH)}</Text>
          ) : (
            <Text>{" ".repeat(COLUMN_WIDTH)}</Text>
          )}
        </Text>
      </Box>

      {/* Row indicator */}
      <Text color={isSelected ? "cyan" : "gray"}>
        {isSelected ? " ←" : "  "} {(rowIndex + 1).toString().padStart(2)}
      </Text>
    </Box>
  );
}
