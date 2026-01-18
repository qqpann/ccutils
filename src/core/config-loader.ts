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

  // Combine all permissions (user + project + local)
  // Note: user permissions are shared, we clone them for each project
  const allPermissions = [
    ...userPermissions.map((p) => ({ ...p })),
    ...projectPerms,
    ...localPerms,
  ];

  return {
    name: getProjectName(projectPath),
    path: projectPath,
    permissions: allPermissions,
  };
}

// Main function to load all configuration
export async function loadConfig(
  projectPatterns: string[],
  userSettingsPath?: string
): Promise<LoadedConfig> {
  // Resolve user settings path
  const userPath = userSettingsPath ?? getDefaultUserSettingsPath();

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
