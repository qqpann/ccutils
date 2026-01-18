import { useState, useCallback } from "react";
import type {
  ScopedPermission,
  PermissionScope,
  LoadedConfig,
  ProjectConfig,
} from "../core/config-types.js";
import { saveConfig } from "../core/config-writer.js";

export interface PermissionState {
  userPermissions: ScopedPermission[];
  projects: ProjectConfig[];
  hasChanges: boolean;
}

// Get scope order for promotion/demotion
const SCOPE_ORDER: PermissionScope[] = ["local", "project", "user"];

function getScopeIndex(scope: PermissionScope): number {
  return SCOPE_ORDER.indexOf(scope);
}

// Create a unique key for a permission (type + rule, without scope)
export function permissionKey(perm: ScopedPermission): string {
  return `${perm.type}:${perm.rule}`;
}

// Create a full key including scope (for exact matching)
export function fullPermissionKey(perm: ScopedPermission): string {
  return `${perm.scope}:${perm.type}:${perm.rule}`;
}

export function usePermissions(initialConfig: LoadedConfig) {
  const [state, setState] = useState<PermissionState>({
    userPermissions: initialConfig.userPermissions,
    projects: initialConfig.projects,
    hasChanges: false,
  });

  // Get permissions for the current project (combining user + project + local)
  // Returns sorted permissions (local first, then project, then user)
  const getProjectPermissions = useCallback(
    (projectIndex: number): ScopedPermission[] => {
      if (projectIndex < 0 || projectIndex >= state.projects.length) {
        return [];
      }
      // Return sorted permissions
      return [...state.projects[projectIndex].permissions].sort((a, b) => {
        const order = { local: 0, project: 1, user: 2 };
        return order[a.scope] - order[b.scope];
      });
    },
    [state.projects]
  );

  // Promote a permission (local → project → user)
  // Uses fullKey to identify the exact permission
  const promotePermission = useCallback(
    (projectIndex: number, fullKey: string) => {
      setState((prev) => {
        const project = prev.projects[projectIndex];
        if (!project) return prev;

        // Find the permission by full key
        const permIdx = project.permissions.findIndex(
          (p) => fullPermissionKey(p) === fullKey
        );
        if (permIdx === -1) return prev;

        const perm = project.permissions[permIdx];
        const currentScopeIdx = getScopeIndex(perm.scope);
        if (currentScopeIdx >= SCOPE_ORDER.length - 1) {
          // Already at user level, can't promote
          return prev;
        }

        const newScope = SCOPE_ORDER[currentScopeIdx + 1];
        const updatedPerm: ScopedPermission = { ...perm, scope: newScope };
        const key = permissionKey(perm);

        // If promoting to user level, add to userPermissions and update all projects
        if (newScope === "user") {
          // Check if already exists in user
          if (prev.userPermissions.some((p) => permissionKey(p) === key)) {
            // Remove from current project only
            const newProjects = prev.projects.map((proj, idx) => {
              if (idx === projectIndex) {
                return {
                  ...proj,
                  permissions: proj.permissions.filter(
                    (p) => fullPermissionKey(p) !== fullKey
                  ),
                };
              }
              return proj;
            });
            return { ...prev, projects: newProjects, hasChanges: true };
          }

          // Add to user permissions
          const newUserPerms = [...prev.userPermissions, updatedPerm];

          // Update all projects: replace existing perm with user-scoped version
          const newProjects = prev.projects.map((proj) => ({
            ...proj,
            permissions: proj.permissions.map((p) =>
              permissionKey(p) === key ? updatedPerm : p
            ),
          }));

          return {
            ...prev,
            userPermissions: newUserPerms,
            projects: newProjects,
            hasChanges: true,
          };
        }

        // Promoting within project (local → project)
        const newProjects = prev.projects.map((proj, idx) => {
          if (idx === projectIndex) {
            return {
              ...proj,
              permissions: proj.permissions.map((p) =>
                fullPermissionKey(p) === fullKey ? updatedPerm : p
              ),
            };
          }
          return proj;
        });

        return { ...prev, projects: newProjects, hasChanges: true };
      });
    },
    []
  );

  // Demote a permission (user → project → local)
  // Uses fullKey to identify the exact permission
  const demotePermission = useCallback(
    (projectIndex: number, fullKey: string) => {
      setState((prev) => {
        const project = prev.projects[projectIndex];
        if (!project) return prev;

        // Find the permission by full key
        const permIdx = project.permissions.findIndex(
          (p) => fullPermissionKey(p) === fullKey
        );
        if (permIdx === -1) return prev;

        const perm = project.permissions[permIdx];
        const currentScopeIdx = getScopeIndex(perm.scope);
        if (currentScopeIdx <= 0) {
          // Already at local level, can't demote
          return prev;
        }

        const newScope = SCOPE_ORDER[currentScopeIdx - 1];
        const updatedPerm: ScopedPermission = { ...perm, scope: newScope };
        const key = permissionKey(perm);

        // If demoting from user level
        if (perm.scope === "user") {
          // Remove from user permissions
          const newUserPerms = prev.userPermissions.filter(
            (p) => permissionKey(p) !== key
          );

          // Update only this project: change to project scope
          const newProjects = prev.projects.map((proj, idx) => {
            if (idx === projectIndex) {
              return {
                ...proj,
                permissions: proj.permissions.map((p) =>
                  fullPermissionKey(p) === fullKey ? updatedPerm : p
                ),
              };
            }
            // Other projects: remove if they had this user permission
            return {
              ...proj,
              permissions: proj.permissions.filter(
                (p) => !(p.scope === "user" && permissionKey(p) === key)
              ),
            };
          });

          return {
            ...prev,
            userPermissions: newUserPerms,
            projects: newProjects,
            hasChanges: true,
          };
        }

        // Demoting within project (project → local)
        const newProjects = prev.projects.map((proj, idx) => {
          if (idx === projectIndex) {
            return {
              ...proj,
              permissions: proj.permissions.map((p) =>
                fullPermissionKey(p) === fullKey ? updatedPerm : p
              ),
            };
          }
          return proj;
        });

        return { ...prev, projects: newProjects, hasChanges: true };
      });
    },
    []
  );

  // Save all changes
  const save = useCallback(
    (userSettingsPath: string) => {
      saveConfig(
        userSettingsPath,
        state.userPermissions,
        state.projects.map((p) => ({ path: p.path, permissions: p.permissions }))
      );
      setState((prev) => ({ ...prev, hasChanges: false }));
    },
    [state.userPermissions, state.projects]
  );

  return {
    state,
    getProjectPermissions,
    promotePermission,
    demotePermission,
    save,
  };
}
