---
"@qqpann/ccutils": patch
---

Fix false positive unsaved changes indicator when reverting scope changes

Previously, cycling through scopes (e.g., left then right) and returning to the original state would still show "unsaved changes". Now the hasChanges flag correctly compares current scopes against originalScopes to determine if actual changes exist.
