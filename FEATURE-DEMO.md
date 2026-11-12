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

## Automated pass

```sh
node --test test/prnui.test.mjs
```
