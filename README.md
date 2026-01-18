# ccutils

[![CI](https://github.com/qqpann/ccutils/actions/workflows/ci.yml/badge.svg)](https://github.com/qqpann/ccutils/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@qqpann/ccutils)](https://www.npmjs.com/package/@qqpann/ccutils)

CLI tool for managing Claude Code permission settings across multiple scopes.

## Features

- **Multi-scope management**: View and edit permissions from user, project, and local settings
- **Interactive TUI**: Terminal-based UI with keyboard navigation
- **Batch editing**: Manage permissions across multiple projects simultaneously
- **Diff visualization**: See changes before saving

## Installation

```bash
npm install -g @qqpann/ccutils
```

Or run directly with npx:

```bash
npx @qqpann/ccutils sync-permissions .
```

## Usage

```bash
# Manage permissions in current directory
ccutils sync-permissions .

# Manage permissions across multiple projects
ccutils sync-permissions ~/workspace/*

# Use custom user settings path (for testing)
ccutils sync-permissions --override-user-settings-path ./sandbox/.claude ./sandbox/projects/*
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate permissions |
| `←` / `→` | Cycle scope (U → P → L) |
| `u` / `p` / `l` | Toggle specific scope |
| `Tab` / `Shift+Tab` | Switch projects |
| `Enter` | Save changes |
| `q` | Quit |

## Permission Scopes

| Scope | File | Description |
|-------|------|-------------|
| User (U) | `~/.claude/settings.json` | Global settings |
| Project (P) | `<project>/.claude/settings.json` | Committed project settings |
| Local (L) | `<project>/.claude/settings.local.json` | Git-ignored local settings |

## Development

```bash
git clone https://github.com/qqpann/ccutils.git
cd ccutils
pnpm install
pnpm run build

# Run locally
node dist/index.js sync-permissions .
```

```bash
pnpm run dev        # Watch mode
pnpm run typecheck  # Type check
pnpm test           # Run tests
```

## Contributing

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

```bash
# After making changes, create a changeset
pnpm changeset

# Follow the prompts to describe your changes
```

When you push to main, GitHub Actions will automatically create a "Version Packages" PR. Merging that PR triggers npm publish.

## License

MIT
