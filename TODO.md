# Refactoring TODO

important: Process immediately with changes to the customui.user.js according to the plan without extra yapping in chat:
- [ ] Step 1: Add `DEFAULT_CONFIG`, `STORAGE_KEYS`, `getSetting()`, `setSetting()` at top of IIFE
- [ ] Step 2: Inject `<style>` element with all CSS classes for custom UI elements
- [ ] Step 3: Refactor `createSetting()` to use class names instead of inline `style.cssText`
- [ ] Step 4: Remove `defaultValue` from all `createSetting()` calls (use `DEFAULT_CONFIG` instead)
- [ ] Step 5: Update `controls`, `dropdownBtn`, `dropdownMenu`, buttons to use CSS classes
- [ ] Step 6: Update `restoreSettings()` to use `getSetting()` helpers
- [ ] Step 7: Update `createAudio()` and `soundDebounceTime` init to use `getSetting()`
- [ ] Step 8: Refactor `createSeeStatsButton()` to use CSS classes + `:hover`, remove JS hover listeners
- [ ] Step 9: Verify no syntax errors and update TODO

