import * as fs from "node:fs";
import {
  type Settings,
  type ScopedPermission,
  type PermissionScope,
  SettingsSchema,
} from "./config-types.js";
import { getProjectSettingsPaths, ensureDir } from "../utils/paths.js";

// Read existing settings or return empty settings
function readExistingSettings(filePath: string): Settings {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(content);
      return SettingsSchema.parse(json);
    }
  } catch {
    // Ignore errors, return default
  }
  return { permissions: { allow: [], deny: [] } };
}

// Write settings to file
function writeSettingsFile(filePath: string, settings: Settings): void {
  ensureDir(filePath);
  const content = JSON.stringify(settings, null, 2) + "\n";
  fs.writeFileSync(filePath, content, "utf-8");
}

// Filter permissions by scope (checks the scope flag)
function filterPermissionsByScope(
  permissions: ScopedPermission[],
  scope: PermissionScope
): ScopedPermission[] {
  return permissions.filter((p) => p.scopes[scope]);
}

// Convert scoped permissions to settings format
function permissionsToSettings(permissions: ScopedPermission[]): Settings {
  const allow = permissions
    .filter((p) => p.type === "allow")
    .map((p) => p.rule);
  const deny = permissions.filter((p) => p.type === "deny").map((p) => p.rule);

  return {
    permissions: { allow, deny },
  };
}

// Merge new permissions into existing settings (preserves other settings fields)
function mergePermissionsIntoSettings(
  existing: Settings,
  permissions: ScopedPermission[]
): Settings {
  const newPerms = permissionsToSettings(permissions);
  return {
    ...existing,
    permissions: newPerms.permissions,
  };
}

// Save user-level permissions
export function saveUserPermissions(
  userSettingsPath: string,
  permissions: ScopedPermission[]
): void {
  const userPerms = filterPermissionsByScope(permissions, "user");
  const existing = readExistingSettings(userSettingsPath);
  const updated = mergePermissionsIntoSettings(existing, userPerms);
  writeSettingsFile(userSettingsPath, updated);
}

// Save project-level permissions (both project and local)
export function saveProjectPermissions(
  projectPath: string,
  permissions: ScopedPermission[]
): void {
  const paths = getProjectSettingsPaths(projectPath);

  // Save project-level permissions
  const projectPerms = filterPermissionsByScope(permissions, "project");
  const existingProject = readExistingSettings(paths.project);
  const updatedProject = mergePermissionsIntoSettings(
    existingProject,
    projectPerms
  );
  writeSettingsFile(paths.project, updatedProject);

  // Save local permissions
  const localPerms = filterPermissionsByScope(permissions, "local");
  const existingLocal = readExistingSettings(paths.local);
  const updatedLocal = mergePermissionsIntoSettings(existingLocal, localPerms);
  writeSettingsFile(paths.local, updatedLocal);
}

// Save all configuration changes
export function saveConfig(
  userSettingsPath: string,
  userPermissions: ScopedPermission[],
  projects: Array<{ path: string; permissions: ScopedPermission[] }>
): void {
  // Save user permissions
  saveUserPermissions(userSettingsPath, userPermissions);

  // Save each project's permissions
  for (const project of projects) {
    saveProjectPermissions(project.path, project.permissions);
  }
}
