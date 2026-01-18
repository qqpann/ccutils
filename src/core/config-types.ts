import { z } from "zod/v4";

// Permission scopes in order of precedence (user is global, local is most specific)
export type PermissionScope = "user" | "project" | "local";

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

// A permission entry with its scope information
export interface ScopedPermission {
  rule: string;
  type: "allow" | "deny";
  scope: PermissionScope;
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

// Change operation for moving permissions between scopes
export interface PermissionChange {
  permission: ScopedPermission;
  fromScope: PermissionScope;
  toScope: PermissionScope;
}
