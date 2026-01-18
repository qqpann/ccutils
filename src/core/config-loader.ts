import * as fs from "node:fs";
import {
  SettingsSchema,
  type Settings,
  type ScopedPermission,
  type ProjectConfig,
  type LoadedConfig,
  type PermissionScope,
  type ScopeFlags,
  scopeToFlags,
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
  const flags = scopeToFlags(scope);

  for (const rule of settings.permissions.allow ?? []) {
    result.push({
      rule,
      type: "allow",
      scopes: { ...flags },
      originalScopes: { ...flags },
    });
  }

  for (const rule of settings.permissions.deny ?? []) {
    result.push({
      rule,
      type: "deny",
      scopes: { ...flags },
      originalScopes: { ...flags },
    });
  }

  return result;
}

// Create a unique key for merging permissions (type + rule)
function permissionKey(perm: ScopedPermission): string {
  return `${perm.type}:${perm.rule}`;
}

// Merge permissions from multiple scopes into a unified list
// If the same rule exists in multiple scopes, combine their scope flags
function mergePermissions(permsList: ScopedPermission[][]): ScopedPermission[] {
  const map = new Map<string, ScopedPermission>();

  for (const perms of permsList) {
    for (const perm of perms) {
      const key = permissionKey(perm);
      const existing = map.get(key);
      if (existing) {
        // Merge scope flags (both current and original)
        existing.scopes = {
          user: existing.scopes.user || perm.scopes.user,
          project: existing.scopes.project || perm.scopes.project,
          local: existing.scopes.local || perm.scopes.local,
        };
        existing.originalScopes = {
          user: existing.originalScopes.user || perm.originalScopes.user,
          project: existing.originalScopes.project || perm.originalScopes.project,
          local: existing.originalScopes.local || perm.originalScopes.local,
        };
      } else {
        map.set(key, {
          ...perm,
          scopes: { ...perm.scopes },
          originalScopes: { ...perm.originalScopes },
        });
      }
    }
  }

  return Array.from(map.values());
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

  // Merge permissions from all scopes
  // Same rule in multiple scopes will be combined into one entry with multiple scope flags
  const allPermissions = mergePermissions([
    localPerms,
    projectPerms,
    userPermissions.map((p) => ({ ...p })),
  ]);

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
