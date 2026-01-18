import { useState, useCallback } from "react";
import type {
  ScopedPermission,
  PermissionScope,
  LoadedConfig,
  ProjectConfig,
  ScopeFlags,
} from "../core/config-types.js";
import {
  countEnabledScopes,
  willBeDeleted,
  scopesChanged,
} from "../core/config-types.js";
import { saveConfig } from "../core/config-writer.js";
import { loadConfig } from "../core/config-loader.js";

export interface PermissionState {
  userPermissions: ScopedPermission[];
  projects: ProjectConfig[];
  hasChanges: boolean;
}

// Scope order for navigation: U -> P -> L (left to right conceptually)
const SCOPE_ORDER: PermissionScope[] = ["user", "project", "local"];

// Create a unique key for a permission (type + rule, without scope)
export function permissionKey(perm: ScopedPermission): string {
  return `${perm.type}:${perm.rule}`;
}

// Check if any permission has changed from original across all projects
function hasAnyChanges(projects: ProjectConfig[]): boolean {
  return projects.some((project) =>
    project.permissions.some((perm) => scopesChanged(perm))
  );
}

// Get single enabled scope (returns null if none or multiple)
function getSingleScope(flags: ScopeFlags): PermissionScope | null {
  const enabled = SCOPE_ORDER.filter((s) => flags[s]);
  return enabled.length === 1 ? enabled[0] : null;
}

// Get next scope in cycle (U -> P -> L -> U)
function getNextScope(scope: PermissionScope): PermissionScope {
  const idx = SCOPE_ORDER.indexOf(scope);
  return SCOPE_ORDER[(idx + 1) % SCOPE_ORDER.length];
}

// Get previous scope in cycle (U <- P <- L <- U)
function getPrevScope(scope: PermissionScope): PermissionScope {
  const idx = SCOPE_ORDER.indexOf(scope);
  return SCOPE_ORDER[(idx - 1 + SCOPE_ORDER.length) % SCOPE_ORDER.length];
}

export function usePermissions(initialConfig: LoadedConfig) {
  const [state, setState] = useState<PermissionState>({
    userPermissions: initialConfig.userPermissions,
    projects: initialConfig.projects,
    hasChanges: false,
  });

  // Get permissions for the current project
  const getProjectPermissions = useCallback(
    (projectIndex: number): ScopedPermission[] => {
      if (projectIndex < 0 || projectIndex >= state.projects.length) {
        return [];
      }
      return state.projects[projectIndex].permissions;
    },
    [state.projects]
  );

  // Toggle a specific scope for the selected permission
  const toggleScope = useCallback(
    (projectIndex: number, permIndex: number, scope: PermissionScope) => {
      setState((prev) => {
        const project = prev.projects[projectIndex];
        if (!project) return prev;

        const perm = project.permissions[permIndex];
        if (!perm) return prev;

        const newScopes: ScopeFlags = {
          ...perm.scopes,
          [scope]: !perm.scopes[scope],
        };

        const updatedPerm: ScopedPermission = { ...perm, scopes: newScopes };

        // Update the permission in the project
        const newProjects = prev.projects.map((proj, idx) => {
          if (idx === projectIndex) {
            return {
              ...proj,
              permissions: proj.permissions.map((p, i) =>
                i === permIndex ? updatedPerm : p
              ),
            };
          }
          return proj;
        });

        // Update userPermissions if user scope changed
        let newUserPerms = prev.userPermissions;
        const key = permissionKey(perm);

        if (scope === "user") {
          if (newScopes.user) {
            // Adding to user scope - add if not exists
            if (!prev.userPermissions.some((p) => permissionKey(p) === key)) {
              newUserPerms = [...prev.userPermissions, updatedPerm];
            }
          } else {
            // Removing from user scope
            newUserPerms = prev.userPermissions.filter(
              (p) => permissionKey(p) !== key
            );
          }
        }

        return {
          ...prev,
          userPermissions: newUserPerms,
          projects: newProjects,
          hasChanges: hasAnyChanges(newProjects),
        };
      });
    },
    []
  );

  // Move left: single scope -> prev scope (loop), multiple -> user only
  const moveLeft = useCallback((projectIndex: number, permIndex: number) => {
    setState((prev) => {
      const project = prev.projects[projectIndex];
      if (!project) return prev;

      const perm = project.permissions[permIndex];
      if (!perm) return prev;

      const enabledCount = countEnabledScopes(perm.scopes);
      let newScopes: ScopeFlags;

      if (enabledCount === 0) {
        // Empty state: go to local (loop from empty)
        newScopes = { user: false, project: false, local: true };
      } else if (enabledCount === 1) {
        // Single scope: cycle to previous
        const currentScope = getSingleScope(perm.scopes)!;
        const prevScope = getPrevScope(currentScope);
        newScopes = { user: false, project: false, local: false };
        newScopes[prevScope] = true;
      } else {
        // Multiple scopes: collapse to user
        newScopes = { user: true, project: false, local: false };
      }

      const updatedPerm: ScopedPermission = { ...perm, scopes: newScopes };

      // Update the permission in the project
      const newProjects = prev.projects.map((proj, idx) => {
        if (idx === projectIndex) {
          return {
            ...proj,
            permissions: proj.permissions.map((p, i) =>
              i === permIndex ? updatedPerm : p
            ),
          };
        }
        return proj;
      });

      // Update userPermissions
      let newUserPerms = prev.userPermissions;
      const key = permissionKey(perm);

      if (newScopes.user && !perm.scopes.user) {
        // Adding to user scope
        if (!prev.userPermissions.some((p) => permissionKey(p) === key)) {
          newUserPerms = [...prev.userPermissions, updatedPerm];
        }
      } else if (!newScopes.user && perm.scopes.user) {
        // Removing from user scope
        newUserPerms = prev.userPermissions.filter(
          (p) => permissionKey(p) !== key
        );
      }

      return {
        ...prev,
        userPermissions: newUserPerms,
        projects: newProjects,
        hasChanges: hasAnyChanges(newProjects),
      };
    });
  }, []);

  // Move right: single scope -> next scope (loop), multiple -> local only
  const moveRight = useCallback((projectIndex: number, permIndex: number) => {
    setState((prev) => {
      const project = prev.projects[projectIndex];
      if (!project) return prev;

      const perm = project.permissions[permIndex];
      if (!perm) return prev;

      const enabledCount = countEnabledScopes(perm.scopes);
      let newScopes: ScopeFlags;

      if (enabledCount === 0) {
        // Empty state: go to user (loop from empty)
        newScopes = { user: true, project: false, local: false };
      } else if (enabledCount === 1) {
        // Single scope: cycle to next
        const currentScope = getSingleScope(perm.scopes)!;
        const nextScope = getNextScope(currentScope);
        newScopes = { user: false, project: false, local: false };
        newScopes[nextScope] = true;
      } else {
        // Multiple scopes: collapse to local
        newScopes = { user: false, project: false, local: true };
      }

      const updatedPerm: ScopedPermission = { ...perm, scopes: newScopes };

      // Update the permission in the project
      const newProjects = prev.projects.map((proj, idx) => {
        if (idx === projectIndex) {
          return {
            ...proj,
            permissions: proj.permissions.map((p, i) =>
              i === permIndex ? updatedPerm : p
            ),
          };
        }
        return proj;
      });

      // Update userPermissions
      let newUserPerms = prev.userPermissions;
      const key = permissionKey(perm);

      if (newScopes.user && !perm.scopes.user) {
        // Adding to user scope
        if (!prev.userPermissions.some((p) => permissionKey(p) === key)) {
          newUserPerms = [...prev.userPermissions, updatedPerm];
        }
      } else if (!newScopes.user && perm.scopes.user) {
        // Removing from user scope
        newUserPerms = prev.userPermissions.filter(
          (p) => permissionKey(p) !== key
        );
      }

      return {
        ...prev,
        userPermissions: newUserPerms,
        projects: newProjects,
        hasChanges: hasAnyChanges(newProjects),
      };
    });
  }, []);

  // Save all changes and reload config from files
  const save = useCallback(
    async (userSettingsPath: string) => {
      // Filter out permissions that will be deleted (no scopes enabled)
      const filteredUserPerms = state.userPermissions.filter(
        (p) => !willBeDeleted(p.scopes)
      );

      const filteredProjects = state.projects.map((proj) => ({
        path: proj.path,
        permissions: proj.permissions.filter((p) => !willBeDeleted(p.scopes)),
      }));

      saveConfig(userSettingsPath, filteredUserPerms, filteredProjects);

      // Reload config from files to ensure all projects have latest user permissions
      const projectPaths = state.projects.map((p) => p.path);
      const reloadedConfig = await loadConfig(projectPaths, userSettingsPath);

      setState({
        userPermissions: reloadedConfig.userPermissions,
        projects: reloadedConfig.projects,
        hasChanges: false,
      });
    },
    [state.userPermissions, state.projects]
  );

  return {
    state,
    getProjectPermissions,
    toggleScope,
    moveLeft,
    moveRight,
    save,
  };
}
