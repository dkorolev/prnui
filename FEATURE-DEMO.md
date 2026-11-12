# PRN UI feature demo

This script verifies the specimen as a future Dise migration target. All displayed values must remain synthetic.

## Desktop visual pass

1. Open `prnui.html` at approximately 1440px wide and 100% zoom. Confirm the theme control offers System, Light, and Dark, and that Dark is selected when nothing has been stored.
2. Scan every section from Foundations through AppShell. Confirm the same surface, border, typography, chamfer, spacing, and semantic-colour vocabulary is used throughout.
3. Confirm every top-level card has one stable two-digit reference on its right edge. Retired references `18` and `19` remain unused so later references do not shift.
4. Confirm cards and nested panels do not look like two independent card systems.
5. Confirm disabled/loading/error/stale examples retain stable geometry and readable full messages.
6. Confirm the short and long time-zone log examples align tightly without a meaningless first-row delta.
7. In the hierarchical checkboxes, confirm the wedge seams render cleanly, the legend names the wedge positions, and hovering a branch row shows its aggregate selection as text.

## Keyboard-only pass

1. Tab through buttons, fields, native select, rich listbox, tabs, scope switcher, copy values, event disclosures, plot, and dialog openers. Every focused control must have a visible focus treatment.
2. On the rich listbox, verify Arrow Up/Down, Home/End, prefix typeahead, Enter/Space, Escape, and Tab. Arrow, Home, and End keys open a closed listbox. The disabled option must not become selected.
3. On the primary tabs, verify Left/Right and Home/End move and activate the immediate sibling panel.
4. On ScopeSwitcher, verify arrow keys change view selection while the separate running-route marker remains distinct.
5. Open each dialog. Tab and Shift+Tab must wrap inside it; Escape must close and restore focus to the opener.
6. Focus a tooltip trigger, wait briefly, and press Escape. It must contain no interactive content.
7. Open a CopyValue, activate Copy, then press Escape. The popover must close and return focus to its value trigger.
8. Open EventLog rows through their full summaries; existing open rows must remain open unless explicitly toggled.
9. Focus the plot and use Left/Right/Home/End. The visible and announced cursor value must update.

## Pointer pass

1. Hover tooltip targets near normal and viewport-edge positions. The tooltip follows the pointer, flips inside the viewport, and closes on leave.
2. Open the rich listbox. The menu attaches flush to its trigger with a squared edge, carries the octagon cut on its far corners, and flips the cut when it opens above near the viewport bottom.
3. Open several CopyValue triggers in sequence. Only one popover may be open.
4. Resize or scroll with a copy popover open. It must reposition on resize and close predictably on scroll.
5. Move over the plot. Only its cursor summary and drawing should change.
6. Activate `Load 20 more` repeatedly. While loading, duplicate requests must be disabled; retained rows must remain visible after expansion and Collapse must restore the initial six.

## Responsive pass

1. At 720px, confirm fields collapse to one column, scope tabs use the select fallback, paired stream values remain labeled, and event metadata forms a deliberate second line.
2. At 620px and below, confirm the hierarchical checkbox tree scrolls horizontally within its own bounded region instead of being clipped by the card chamfer.
3. At 390–520px, confirm dialog actions stack, state galleries become one column, and secondary navigation/table content scrolls within its own bounded region.
4. Confirm no dialog, listbox, tooltip, copy popover, table, code block, token, or long route identity creates horizontal page overflow.

## State and motion pass

1. Review Card, Select, DataTable, EventLog, Plot, Dialog, and ScopeSwitcher examples for named empty/loading/error/stale treatments.
2. Emulate `prefers-reduced-motion: reduce`. Spinners, connecting indicators, skeletons, and disclosure transitions must stop while their textual states remain available; page and programmatic scrolling become instant.
3. Confirm status meaning is always reinforced by text, not colour alone.
4. Confirm errors and multi-reason holds are neither line-clamped nor clipped.

## Hierarchical expansion

1. In card 04, collapse a nested branch with `[-]`, then collapse and reopen its
   parent. The nested branch stays collapsed and all checked values remain intact.
2. Tab to `[+]` and press Enter, then Space. Children appear and disappear; focus
   remains on the button and hidden children are skipped by Tab.
3. With a branch collapsed, use its checkbox and each per-kind selection diamond.
   Counts update for all descendants. Reopen to verify the hidden selections.
4. At 390px, tap the expand button. It toggles only visibility, not its neighboring
   checkbox. The tree remains inside its horizontal scroll region.

## Live reading (card 33)

1. Send one observation. The displayed revision and counts advance. Start the
   synthetic source; its latest revision advances every two seconds.
2. Select text across two table cells. Wait for multiple observations. Selected
   text, displayed revision, and row positions stay unchanged; the source revision
   keeps advancing. The held notice stays visible after clearing selection.
3. Activate **Show latest observation**. The table jumps to the newest observation,
   not through intermediate ones. Keyboard focus stays on the action. Subsequent
   observations follow without another click.
4. Focus the scrollable table with Tab and wait. It holds on the next observation.
   Tab away: it remains held. Resume explicitly.
5. At 390px, scroll the table horizontally; at any width, scroll it vertically.
   Either holds on the next observation. Resume resets both scroll offsets.
   No table or control causes horizontal page overflow at 320px.
6. Hold reading manually, then stop the source. Reading remains held and the source
   says stopped. Resume works even with no pending replacement. Selecting text
   outside the table neither holds it nor loses that selection on resume.
7. Open Reading contract and leave it open during updates. It stays open. With
   reduced motion enabled, the source remains usable and conveys state in text.

## Automated pass

```sh
node --test test/prnui.test.mjs
node --test test/live-reading.browser.mjs
```

The browser test uses an installed Chrome (macOS default, or `CHROME_BIN`), a
temporary profile and loopback debugging only. It closes its browser and removes
the profile after the run; no server or package installation is required.
