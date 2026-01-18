import { z } from "zod/v4";

// Permission scopes in order of precedence (user is global, local is most specific)
export type PermissionScope = "user" | "project" | "local";

// Multi-scope flags for new [U P L] format
export interface ScopeFlags {
  user: boolean;
  project: boolean;
  local: boolean;
}

// Helper to create ScopeFlags from a single scope
export function scopeToFlags(scope: PermissionScope): ScopeFlags {
  return {
    user: scope === "user",
    project: scope === "project",
    local: scope === "local",
  };
}

// Helper to count enabled scopes
export function countEnabledScopes(flags: ScopeFlags): number {
  return (flags.user ? 1 : 0) + (flags.project ? 1 : 0) + (flags.local ? 1 : 0);
}

// Check if the rule will be deleted (no scopes enabled)
export function willBeDeleted(flags: ScopeFlags): boolean {
  return !flags.user && !flags.project && !flags.local;
}

// Zod schema for permissions in settings files
export const PermissionsSchema = z.object({
  allow: z.array(z.string()).optional().default([]),
  deny: z.array(z.string()).optional().default([]),
});

// Zod schema for Claude settings file
// Use passthrough() to preserve unknown fields (statusLine, enabledPlugins, etc.)
export const SettingsSchema = z
  .object({
    permissions: PermissionsSchema.optional(),
  })
  .passthrough();

export type Permissions = z.infer<typeof PermissionsSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

// A permission entry with its scope information (supports multiple scopes)
export interface ScopedPermission {
  rule: string;
  type: "allow" | "deny";
  scopes: ScopeFlags;
  originalScopes: ScopeFlags; // Track original state for diff display
}

// Check if scopes have changed from original
export function scopesChanged(perm: ScopedPermission): boolean {
  return (
    perm.scopes.user !== perm.originalScopes.user ||
    perm.scopes.project !== perm.originalScopes.project ||
    perm.scopes.local !== perm.originalScopes.local
  );
}

// Project with its permissions from all scopes
export interface ProjectConfig {
  name: string;
  path: string;
  permissions: ScopedPermission[];
}

// All loaded configuration data
export interface LoadedConfig {
  userSettingsPath: string;
  userPermissions: ScopedPermission[];
  projects: ProjectConfig[];
}

// Change operation for toggling scope flags
export interface PermissionChange {
  permission: ScopedPermission;
  newScopes: ScopeFlags;
}
