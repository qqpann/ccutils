import React from "react";
import { Text } from "ink";
import type { ScopedPermission, ScopeFlags } from "../core/config-types.js";
import { willBeDeleted, scopesChanged } from "../core/config-types.js";

interface PermissionRowProps {
  permission: ScopedPermission;
  isSelected: boolean;
}

// Render a single scope indicator with diff coloring (2 characters each)
// " X" (cyan) = unchanged enabled
// "+X" (green) = added
// " -" (gray) = removed
// "  " = unchanged disabled
function ScopeIndicator({
  label,
  current,
  original,
}: {
  label: string;
  current: boolean;
  original: boolean;
}) {
  if (current && !original) {
    // Added: +X in green
    return <Text color="green">+{label}</Text>;
  } else if (current && original) {
    // Unchanged enabled: space + X in cyan
    return <Text color="cyan"> {label}</Text>;
  } else if (!current && original) {
    // Removed: space + - in gray
    return <Text color="gray"> -</Text>;
  } else {
    // Unchanged disabled: two spaces
    return <Text>{"  "}</Text>;
  }
}

// Render scope flags with diff display
// Fixed format: [UUPPLL] = 6 characters inside brackets
function ScopeFlagsDisplay({
  scopes,
  originalScopes,
  hasChanges,
}: {
  scopes: ScopeFlags;
  originalScopes: ScopeFlags;
  hasChanges: boolean;
}) {
  // If no changes, use simple format with consistent spacing
  if (!hasChanges) {
    const u = scopes.user ? " U" : "  ";
    const p = scopes.project ? " P" : "  ";
    const l = scopes.local ? " L" : "  ";
    return <Text color="cyan">[{u}{p}{l}]</Text>;
  }

  // With changes, show diff format
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

export function PermissionRow({
  permission,
  isSelected,
}: PermissionRowProps) {
  const formattedPerm = formatPermission(permission);
  const textColor = permission.type === "allow" ? "green" : "red";
  const isDeleting = willBeDeleted(permission.scopes);
  const hasChanges = scopesChanged(permission);

  const selector = isSelected ? "▸" : " ";
  const bgColor = isSelected ? "blue" : undefined;

  return (
    <Text backgroundColor={bgColor}>
      <Text color="cyan">{selector}</Text>
      <Text> </Text>
      <ScopeFlagsDisplay
        scopes={permission.scopes}
        originalScopes={permission.originalScopes}
        hasChanges={hasChanges}
      />
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
