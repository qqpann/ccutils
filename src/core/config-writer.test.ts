import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { saveUserPermissions, saveProjectPermissions } from "./config-writer.js";
import type { ScopedPermission } from "./config-types.js";

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
        { rule: "Bash(mkdir:*)", type: "allow", scope: "user" },
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
        { rule: "WebSearch", type: "allow", scope: "user" },
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
        { rule: "NewRule", type: "allow", scope: "project" },
      ];
      saveProjectPermissions(projectDir, permissions);

      const result = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      expect(result.permissions.allow).toEqual(["NewRule"]);
      expect(result.customProjectSetting).toBe("value");
    });
  });
});
