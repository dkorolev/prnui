# prnui

Stylebook for AI-coded operational UI.

`prnui.html` is the self-contained component specimen. Open it directly in a
browser; it has no build step or external runtime.

## Overlay rule

- Use a Tooltip only for short, noninteractive supplementary help.
- Use a CopyPopover for one compact value that must be selected or copied.
- Use a docked Inspector for structured details, links, tables, or anything a
  person may need to read while keeping the inspected surface visible.

An Inspector always owns reserved layout space. Hover or focus previews a
target, click pins it, and Escape or the clear button releases it. Its position
never follows the pointer and it never covers the content being inspected.
