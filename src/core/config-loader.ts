import * as fs from "node:fs";
import {
  SettingsSchema,
  type Settings,
  type ScopedPermission,
  type ProjectConfig,
  type LoadedConfig,
  type PermissionScope,
} from "./config-types.js";
import {
  getDefaultUserSettingsPath,
  getProjectSettingsPaths,
  expandProjectPaths,
  getProjectName,
} from "../utils/paths.js";

// Read and parse a settings file
function readSettingsFile(filePath: string): Settings | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(content);
    return SettingsSchema.parse(json);
  } catch (error) {
    // Return null for invalid files
    return null;
  }
}

// Extract permissions from settings file as scoped permissions
function extractPermissions(
  settings: Settings | null,
  scope: PermissionScope
): ScopedPermission[] {
  if (!settings?.permissions) {
    return [];
  }

  const result: ScopedPermission[] = [];

  for (const rule of settings.permissions.allow ?? []) {
    result.push({ rule, type: "allow", scope });
  }

  for (const rule of settings.permissions.deny ?? []) {
    result.push({ rule, type: "deny", scope });
  }

  return result;
}

// Load configuration for a single project
function loadProjectConfig(
  projectPath: string,
  userPermissions: ScopedPermission[]
): ProjectConfig {
  const paths = getProjectSettingsPaths(projectPath);
  const projectSettings = readSettingsFile(paths.project);
  const localSettings = readSettingsFile(paths.local);

  const projectPerms = extractPermissions(projectSettings, "project");
  const localPerms = extractPermissions(localSettings, "local");

  // Combine all permissions in fixed order: local → project → user
  // This order is preserved throughout the session (only scope changes, not position)
  const allPermissions = [
    ...localPerms,
    ...projectPerms,
    ...userPermissions.map((p) => ({ ...p })),
  ];

  return {
    name: getProjectName(projectPath),
    path: projectPath,
    permissions: allPermissions,
  };
}

// Resolve user settings path (handle both directory and file paths)
function resolveUserSettingsPath(pathOrDir?: string): string {
  if (!pathOrDir) {
    return getDefaultUserSettingsPath();
  }

  // If it's a directory, append settings.json
  try {
    if (fs.existsSync(pathOrDir) && fs.statSync(pathOrDir).isDirectory()) {
      return `${pathOrDir}/settings.json`;
    }
  } catch {
    // Ignore errors
  }

  // If it already ends with .json, use as-is
  if (pathOrDir.endsWith(".json")) {
    return pathOrDir;
  }

  // Otherwise, assume it's a .claude directory path
  return `${pathOrDir}/settings.json`;
}

// Main function to load all configuration
export async function loadConfig(
  projectPatterns: string[],
  userSettingsPath?: string
): Promise<LoadedConfig> {
  // Resolve user settings path (handle directory or file)
  const userPath = resolveUserSettingsPath(userSettingsPath);

  // Load user-level permissions
  const userSettings = readSettingsFile(userPath);
  const userPermissions = extractPermissions(userSettings, "user");

  // Expand project paths and load each project
  const projectPaths = await expandProjectPaths(projectPatterns);
  const projects = projectPaths.map((p) =>
    loadProjectConfig(p, userPermissions)
  );

  return {
    userSettingsPath: userPath,
    userPermissions,
    projects,
  };
}

// Re-export types
export type { LoadedConfig, ProjectConfig, ScopedPermission };
