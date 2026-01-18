---
"@qqpann/ccutils": patch
---

Fix first permission row being clipped when scrolling is needed

The first row was hidden in terminals where the viewport calculation was off by one or two lines. This was caused by missing layout constants (TABS_MARGIN_BOTTOM and STATUS_MESSAGE_MARGIN_TOP) in the fixed UI lines calculation.

Changes:
- Replace magic number with detailed LAYOUT constants for each UI element
- Fix viewportHeight calculation to use containerHeight instead of terminalHeight
- Add ink-testing-library for component rendering tests
- Add test files for ThreeColumnPane and App layout rendering
