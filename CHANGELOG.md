# @qqpann/ccutils

## 0.1.0

### Minor Changes

- fc46363: Add mouse click support for tab navigation. Users can now click on project tabs to switch between projects, in addition to using Tab/Shift+Tab keyboard shortcuts.
- 38d0f3c: Add mouse scroll support for navigating permissions list

### Patch Changes

- 83df24d: Fix first permission row being clipped when scrolling is needed

  The first row was hidden in terminals where the viewport calculation was off by one or two lines. This was caused by missing layout constants (TABS_MARGIN_BOTTOM and STATUS_MESSAGE_MARGIN_TOP) in the fixed UI lines calculation.

  Changes:

  - Replace magic number with detailed LAYOUT constants for each UI element
  - Fix viewportHeight calculation to use containerHeight instead of terminalHeight
  - Add ink-testing-library for component rendering tests
  - Add test files for ThreeColumnPane and App layout rendering

- b4c90b9: feat: add mouse click support for tab navigation

  - Click on project tabs to switch between projects
  - Fix screen flickering when there are unsaved changes (using Ink #359 workaround)
  - Improve layout stability with flexbox (flexShrink/flexGrow)
  - Memoize PermissionRow component to prevent unnecessary re-renders

- 626548d: Split status bar key bindings into two lines for better readability

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
