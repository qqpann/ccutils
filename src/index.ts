import React from "react";
import { render } from "ink";
import { App } from "./app.js";
import { loadConfig } from "./core/config-loader.js";

// Parse command line arguments
function parseArgs(args: string[]): {
  command: string;
  paths: string[];
  userSettingsPath?: string;
} {
  const result: {
    command: string;
    paths: string[];
    userSettingsPath?: string;
  } = {
    command: "",
    paths: [],
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--override-user-settings-path" && i + 1 < args.length) {
      result.userSettingsPath = args[i + 1];
      i += 2;
      continue;
    }

    if (!result.command && !arg.startsWith("-")) {
      result.command = arg;
      i++;
      continue;
    }

    if (!arg.startsWith("-")) {
      result.paths.push(arg);
    }

    i++;
  }

  return result;
}

// Print usage
function printUsage(): void {
  console.log(`
ccutils - Claude Code 設定管理ツール

Usage:
  ccutils sync-permissions <paths...>
  ccutils sync-permissions --override-user-settings-path <path> <paths...>

Commands:
  sync-permissions    パーミッション設定を対話的に管理

Options:
  --override-user-settings-path <path>
    ユーザー設定ファイルのパスを指定（サンドボックステスト用）

Examples:
  ccutils sync-permissions .
  ccutils sync-permissions ~/workspace/*
  ccutils sync-permissions --override-user-settings-path ./.claude ./projects/*
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const parsed = parseArgs(args);

  if (parsed.command !== "sync-permissions") {
    console.error(`Unknown command: ${parsed.command}`);
    printUsage();
    process.exit(1);
  }

  if (parsed.paths.length === 0) {
    console.error("Error: At least one project path is required");
    printUsage();
    process.exit(1);
  }

  try {
    // Load configuration
    const config = await loadConfig(parsed.paths, parsed.userSettingsPath);

    if (config.projects.length === 0) {
      console.error(
        "No projects with .claude directory found in the specified paths"
      );
      process.exit(1);
    }

    // Render the TUI
    const { waitUntilExit } = render(React.createElement(App, { config }));
    await waitUntilExit();
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
