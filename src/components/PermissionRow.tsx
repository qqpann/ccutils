import React from "react";
import { Box, Text } from "ink";
import type { ScopedPermission } from "../core/config-types.js";

interface PermissionRowProps {
  permission: ScopedPermission;
  isSelected: boolean;
}

const COLUMN_WIDTH = 24;
const CONTENT_WIDTH = COLUMN_WIDTH - 2; // Leave room for selector

function formatPermission(perm: ScopedPermission): string {
  // Use checkmark for allow, X for deny
  const prefix = perm.type === "allow" ? "✓" : "✗";
  return `${prefix} ${perm.rule}`;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function PermissionRow({
  permission,
  isSelected,
}: PermissionRowProps) {
  const formattedPerm = formatPermission(permission);
  const textColor = permission.type === "allow" ? "green" : "red";
  const truncatedText = truncate(formattedPerm, CONTENT_WIDTH);

  const renderCell = (scope: "user" | "project" | "local") => {
    const isActive = permission.scope === scope;
    const showSelector = isSelected && isActive;
    const bgColor = showSelector ? "blue" : undefined;
    const selector = showSelector ? "▸" : " ";

    if (isActive) {
      return (
        <Text backgroundColor={bgColor}>
          <Text color="cyan">{selector}</Text>
          <Text color={textColor}>{truncatedText.padEnd(CONTENT_WIDTH)}</Text>
        </Text>
      );
    } else {
      return <Text>{" ".repeat(COLUMN_WIDTH)}</Text>;
    }
  };

  return (
    <Box>
      <Box width={COLUMN_WIDTH}>{renderCell("user")}</Box>
      <Text color="gray">│</Text>
      <Box width={COLUMN_WIDTH}>{renderCell("project")}</Box>
      <Text color="gray">│</Text>
      <Box width={COLUMN_WIDTH}>{renderCell("local")}</Box>
    </Box>
  );
}
