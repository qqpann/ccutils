import { glob } from "glob";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Default user settings path
export function getDefaultUserSettingsPath(): string {
  return path.join(os.homedir(), ".claude", "settings.json");
}

// Get settings file paths for a project directory
export function getProjectSettingsPaths(projectPath: string): {
  project: string;
  local: string;
} {
  const claudeDir = path.join(projectPath, ".claude");
  return {
    project: path.join(claudeDir, "settings.json"),
    local: path.join(claudeDir, "settings.local.json"),
  };
}

// Check if a directory is a valid project (has .claude directory)
export function isValidProject(projectPath: string): boolean {
  const claudeDir = path.join(projectPath, ".claude");
  return fs.existsSync(claudeDir) && fs.statSync(claudeDir).isDirectory();
}

// Expand glob patterns and return valid project directories
export async function expandProjectPaths(
  patterns: string[]
): Promise<string[]> {
  const allPaths: string[] = [];

  for (const pattern of patterns) {
    // Expand glob pattern
    const expanded = await glob(pattern, {
      absolute: true,
      nodir: false,
    });

    for (const p of expanded) {
      // Check if it's a directory
      try {
        const stat = fs.statSync(p);
        if (stat.isDirectory() && isValidProject(p)) {
          allPaths.push(p);
        }
      } catch {
        // Skip non-existent paths
      }
    }
  }

  // Remove duplicates and sort
  return [...new Set(allPaths)].sort();
}

// Get project name from path
export function getProjectName(projectPath: string): string {
  return path.basename(projectPath);
}

// Ensure directory exists for a file path
export function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
