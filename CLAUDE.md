# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`ccutils` is a CLI tool for managing Claude Code permission settings across multiple scopes. It provides a terminal UI (TUI) for viewing and editing permissions from user-level, project-level, and local (git-ignored) settings files.

## Commands

```bash
pnpm install          # Install dependencies
pnpm run build        # Build with tsup (outputs dist/index.js)
pnpm run dev          # Watch mode for development
pnpm run typecheck    # Type check without emitting
pnpm test             # Run vitest tests

# Changesets (versioning)
pnpm changeset        # Create a changeset for your changes
pnpm version          # Apply changesets and bump versions
pnpm release          # Build and publish to npm

# Run the CLI locally
node dist/index.js sync-permissions .
node dist/index.js sync-permissions --override-user-settings-path ./sandbox/.claude ./sandbox/projects/*
```

## Architecture

### Permission Scope Model

The tool manages permissions across three scopes with increasing specificity:
- **User** (`~/.claude/settings.json`) - Global settings
- **Project** (`<project>/.claude/settings.json`) - Committed project settings
- **Local** (`<project>/.claude/settings.local.json`) - Git-ignored local settings

Permissions from all scopes are merged and displayed with `[ U P L]` scope flags. A permission can exist in multiple scopes simultaneously.

### Core Structure

```
src/
├── index.ts              # CLI entry, argument parsing, main()
├── app.tsx               # Root Ink/React component
├── components/           # TUI components (PermissionRow, ProjectTabs, StatusBar, ThreeColumnPane)
├── core/
│   ├── config-types.ts   # Zod schemas, ScopedPermission, ScopeFlags types
│   ├── config-loader.ts  # Load and merge permissions from all scopes
│   └── config-writer.ts  # Save permissions back to scope files
├── hooks/
│   ├── usePermissions.ts # Permission state, scope toggling, save logic
│   └── useNavigation.ts  # Keyboard input, viewport scrolling
└── utils/
    └── paths.ts          # Glob expansion, path utilities
```

### Key Patterns

**Scope merging**: `config-loader.ts` merges same rules from different scopes into a single `ScopedPermission` with combined `ScopeFlags`

**Diff tracking**: Each permission has `scopes` (current) and `originalScopes` (at load time) to show changes

**Scope cycling**: Arrow keys cycle single-scope permissions through U→P→L→U; multi-scope permissions collapse to single scope

**Zod passthrough**: `SettingsSchema` uses `.passthrough()` to preserve unknown fields (statusLine, enabledPlugins) when writing

### TUI Stack

Uses Ink (React renderer for terminals) with:
- `useInput` for keyboard handling
- `Box`/`Text` for flexbox-style layout
- `useStdout` for terminal dimensions

## Testing

Tests are in `src/core/config-writer.test.ts`. The test file validates:
- Preservation of non-permission settings fields during writes
- Handling of empty permissions
- Proper scope-specific file writes

## CI/CD

The project uses GitHub Actions for CI and Changesets for release management.

### Workflows

- **CI** (`.github/workflows/ci.yml`): Runs on all branches and PRs. Executes build, typecheck, and tests.
- **Publish** (`.github/workflows/publish.yml`): Runs on main branch. Creates "Version Packages" PR or publishes to npm.

### Release Flow

1. Make changes and commit
2. Run `pnpm changeset` to create a changeset file describing the change
3. Push to main
4. GitHub Actions creates a "Version Packages" PR automatically
5. Merge the PR → npm publish happens automatically

### Required Secrets

- `NPM_TOKEN`: npm access token (Automation type) for publishing
