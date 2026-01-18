import React, { memo } from "react";
import { Text } from "ink";
import type { ScopedPermission, ScopeFlags } from "../core/config-types.js";
import { willBeDeleted } from "../core/config-types.js";

interface PermissionRowProps {
  permission: ScopedPermission;
  isSelected: boolean;
}

// Render a single scope indicator with diff coloring (2 characters each)
// " X" (cyan) = unchanged enabled
// "+X" (green) = added
// " -" (gray) = removed
// "  " = unchanged disabled
// Always return the same JSX structure to prevent Ink flickering
function ScopeIndicator({
  label,
  current,
  original,
}: {
  label: string;
  current: boolean;
  original: boolean;
}) {
  let color: string | undefined = "cyan";
  let content = "  ";

  if (current && !original) {
    color = "green";
    content = `+${label}`;
  } else if (current && original) {
    color = "cyan";
    content = ` ${label}`;
  } else if (!current && original) {
    color = "gray";
    content = " -";
  } else {
    color = undefined;
    content = "  ";
  }

  return <Text color={color}>{content}</Text>;
}

// Render scope flags with diff display
// Fixed format: [UUPPLL] = 6 characters inside brackets
// Always use the same component structure to prevent Ink flickering
function ScopeFlagsDisplay({
  scopes,
  originalScopes,
}: {
  scopes: ScopeFlags;
  originalScopes: ScopeFlags;
}) {
  return (
    <Text>
      <Text color="cyan">[</Text>
      <ScopeIndicator label="U" current={scopes.user} original={originalScopes.user} />
      <ScopeIndicator label="P" current={scopes.project} original={originalScopes.project} />
      <ScopeIndicator label="L" current={scopes.local} original={originalScopes.local} />
      <Text color="cyan">]</Text>
    </Text>
  );
}

function formatPermission(perm: ScopedPermission): string {
  // Use checkmark for allow, X for deny
  const prefix = perm.type === "allow" ? "✓" : "✗";
  return `${prefix} ${perm.rule}`;
}

export const PermissionRow = memo(function PermissionRow({
  permission,
  isSelected,
}: PermissionRowProps) {
  const formattedPerm = formatPermission(permission);
  const textColor = permission.type === "allow" ? "green" : "red";
  const isDeleting = willBeDeleted(permission.scopes);

  const selector = isSelected ? "▸" : " ";
  const bgColor = isSelected ? "gray" : undefined;

  return (
    <Text backgroundColor={bgColor}>
      <Text color="cyan">{selector}</Text>
      <Text> </Text>
      <ScopeFlagsDisplay
        scopes={permission.scopes}
        originalScopes={permission.originalScopes}
      />
      <Text> </Text>
      <Text color={isDeleting ? "gray" : textColor} strikethrough={isDeleting}>
        {formattedPerm}
      </Text>
      <Text color="yellow" dimColor>
        {isDeleting ? " (Will DELETE)" : ""}
      </Text>
    </Text>
  );
});
