# ccutils

CLI tool for managing Claude Code permission settings across multiple scopes.

## Features

- **Multi-scope management**: View and edit permissions from user, project, and local settings
- **Interactive TUI**: Terminal-based UI with keyboard navigation
- **Batch editing**: Manage permissions across multiple projects simultaneously
- **Diff visualization**: See changes before saving

## Installation

```bash
pnpm install
pnpm run build
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
pnpm run dev        # Watch mode
pnpm run typecheck  # Type check
pnpm test           # Run tests
```

## License

ISC
