# @qqpann/ccutils

## 0.0.6

### Patch Changes

- 721d8a9: Fix false positive unsaved changes indicator when reverting scope changes

  Previously, cycling through scopes (e.g., left then right) and returning to the original state would still show "unsaved changes". Now the hasChanges flag correctly compares current scopes against originalScopes to determine if actual changes exist.

- 82d6221: Change scroll indicators from "items hidden" to "items above/below" for clearer direction
- 88a477c: Move scope legend (U=User P=Project L=Local) to the left side of the status bar
- c93806f: Add delete/backspace key support to remove permissions from all scopes

## 0.0.5

### Patch Changes

- b2b13c4: Fix User scope not reflecting on other project tabs after save by reloading config from files
- cb3ae7e: Sort permissions by scope type (L, P, U, multiple) and alphabetically within each group

## 0.0.4

### Patch Changes

- 12bb3c8: Improve visibility of hidden items indicator by removing dimColor attribute

## 0.0.3

### Patch Changes

- b363970: Reorganize UI legend and key bindings layout

  - Remove dim legend from top of permission list
  - Move U/P/L scope legend to StatusBar next to allow/deny
  - Add u/p/l toggle scope hint to key bindings row

## 0.0.2

### Patch Changes

- 8e2c91f: Change selected row background color from blue to gray for better visibility
