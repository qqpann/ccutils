import React from "react";
import { Text } from "ink";
import type { ScopedPermission } from "../core/config-types.js";
import { willBeDeleted } from "../core/config-types.js";

interface PermissionRowProps {
  permission: ScopedPermission;
  isSelected: boolean;
}

function formatScopeFlags(scopes: ScopedPermission["scopes"]): string {
  const u = scopes.user ? "U" : " ";
  const p = scopes.project ? "P" : " ";
  const l = scopes.local ? "L" : " ";
  return `[${u} ${p} ${l}]`;
}

function formatPermission(perm: ScopedPermission): string {
  // Use checkmark for allow, X for deny
  const prefix = perm.type === "allow" ? "✓" : "✗";
  return `${prefix} ${perm.rule}`;
}

export function PermissionRow({
  permission,
  isSelected,
}: PermissionRowProps) {
  const scopeFlags = formatScopeFlags(permission.scopes);
  const formattedPerm = formatPermission(permission);
  const textColor = permission.type === "allow" ? "green" : "red";
  const isDeleting = willBeDeleted(permission.scopes);

  const selector = isSelected ? "▸" : " ";
  const bgColor = isSelected ? "blue" : undefined;

  return (
    <Text backgroundColor={bgColor}>
      <Text color="cyan">{selector}</Text>
      <Text> </Text>
      <Text color={isDeleting ? "gray" : "cyan"}>{scopeFlags}</Text>
      <Text> </Text>
      <Text color={isDeleting ? "gray" : textColor} strikethrough={isDeleting}>
        {formattedPerm}
      </Text>
      {isDeleting && (
        <Text color="yellow" dimColor> (Will DELETE)</Text>
      )}
    </Text>
  );
}
