import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { saveUserPermissions, saveProjectPermissions } from "./config-writer.js";
import type { ScopedPermission } from "./config-types.js";

// Helper to create ScopeFlags
function makeScopes(user: boolean, project: boolean, local: boolean) {
  return { user, project, local };
}

// Helper to create a permission with both scopes and originalScopes
function makePerm(
  rule: string,
  type: "allow" | "deny",
  user: boolean,
  project: boolean,
  local: boolean
): ScopedPermission {
  const scopes = makeScopes(user, project, local);
  return { rule, type, scopes, originalScopes: { ...scopes } };
}

describe("config-writer", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ccutils-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("saveUserPermissions", () => {
    it("should preserve existing settings fields when updating permissions", () => {
      const settingsPath = path.join(tempDir, "settings.json");

      // Create a settings file with extra fields
      const originalSettings = {
        statusLine: {
          type: "command",
          command: "bun x ccusage statusline",
          padding: 0,
        },
        enabledPlugins: {
          "frontend-design@claude-plugins-official": true,
          "context7@claude-plugins-official": true,
        },
        alwaysThinkingEnabled: true,
        permissions: {
          allow: ["WebSearch"],
          deny: [],
        },
      };
      fs.writeFileSync(settingsPath, JSON.stringify(originalSettings, null, 2));

      // Save new permissions
      const newPermissions: ScopedPermission[] = [
        makePerm("Bash(mkdir:*)", "allow", true, false, false),
      ];
      saveUserPermissions(settingsPath, newPermissions);

      // Read back and verify
      const result = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));

      // Permissions should be updated
      expect(result.permissions).toEqual({
        allow: ["Bash(mkdir:*)"],
        deny: [],
      });

      // Other fields should be preserved
      expect(result.statusLine).toEqual(originalSettings.statusLine);
      expect(result.enabledPlugins).toEqual(originalSettings.enabledPlugins);
      expect(result.alwaysThinkingEnabled).toBe(true);
    });

    it("should create new file with only permissions when file does not exist", () => {
      const settingsPath = path.join(tempDir, "new-settings.json");

      const permissions: ScopedPermission[] = [
        makePerm("WebSearch", "allow", true, false, false),
      ];
      saveUserPermissions(settingsPath, permissions);

      const result = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      expect(result.permissions).toEqual({
        allow: ["WebSearch"],
        deny: [],
      });
    });

    it("should handle empty permissions array", () => {
      const settingsPath = path.join(tempDir, "settings.json");

      const originalSettings = {
        statusLine: { type: "command" },
        permissions: { allow: ["WebSearch"], deny: [] },
      };
      fs.writeFileSync(settingsPath, JSON.stringify(originalSettings, null, 2));

      saveUserPermissions(settingsPath, []);

      const result = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      expect(result.permissions).toEqual({ allow: [], deny: [] });
      expect(result.statusLine).toEqual({ type: "command" });
    });
  });

  describe("saveProjectPermissions", () => {
    it("should preserve existing settings in project settings.json", () => {
      const projectDir = path.join(tempDir, "project");
      const claudeDir = path.join(projectDir, ".claude");
      fs.mkdirSync(claudeDir, { recursive: true });

      const settingsPath = path.join(claudeDir, "settings.json");
      const originalSettings = {
        customProjectSetting: "value",
        permissions: { allow: ["OldRule"], deny: [] },
      };
      fs.writeFileSync(settingsPath, JSON.stringify(originalSettings, null, 2));

      const permissions: ScopedPermission[] = [
        makePerm("NewRule", "allow", false, true, false),
      ];
      saveProjectPermissions(projectDir, permissions);

      const result = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      expect(result.permissions.allow).toEqual(["NewRule"]);
      expect(result.customProjectSetting).toBe("value");
    });
  });
});
