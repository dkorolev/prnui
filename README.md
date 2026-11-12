# prnui

Stylebook for AI-coded operational UI.

PRN UI is a self-contained HTML/CSS/JavaScript specimen for the later Dise console migration. It documents the visual language, semantic markup, interaction states, keyboard behavior, responsive rules, and cross-component empty/loading/error/stale states in one auditable page.

No Dise source is changed here. Every repository, job, route, stream, event, result, artifact, and capability value in the demo is synthetic.

## Run the specimen

Open `prnui.html` directly, or serve the repository with any static file server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/prnui.html`. The page has no build step, package install, external font, CDN, framework, or runtime data fetch. Its only companion asset is `favicon.svg`.

The specimen is dark unless a theme is chosen. The theme control offers System, Light, and Dark, and the choice is remembered in this browser. `?theme=light` (or `system`, or `dark`) shows that theme once without replacing the remembered choice. With no choice stored, the page keeps the dark palette, including for consumers that read the stylesheet and set no theme.

## Android app

The same specimen is available as an offline Android app with a launcher icon,
system Back handling, clipboard support, and layouts that account for the keyboard
and system bars. It packages the existing UI in Android's WebView; the controls
retain their HTML/CSS implementation. All demo data is still synthetic.

Build an installable APK with JDK 17 and Android SDK 35 installed:

```sh
./android/build-apk.sh
```

Open `dist/prnui.apk` on an Android 8.0 or newer device and tap **Install**.
Android may first ask you to allow installation from the browser or file manager
that opened it. No server, account, or network connection is needed to run the app.

See [android/README.md](android/README.md) for SDK setup, USB installation,
signing details, and emulator verification.

## Verify it

The zero-dependency test suite uses Node's built-in test runner:

```sh
node --test test/prnui.test.mjs
node --test test/live-reading.browser.mjs
```

For visual and keyboard verification, follow [FEATURE-DEMO.md](FEATURE-DEMO.md). The checklist covers desktop, sub-520px, dense-table, reduced-motion, pointer, and keyboard-only paths.

The browser test requires Node with built-in WebSocket support and an installed
Chrome (macOS default or `CHROME_BIN`). It uses and removes a temporary browser
profile; no packages or application server are needed.

## Component inventory

The specimen covers the 20 requested families and compositions:

1. Card and Panel
2. Button
3. Field, TextInput, and PasswordInput
4. Select and Listbox
5. Checkbox and PermissionChecklist
6. Tabs and SegmentedControl
7. ScopeSwitcher
8. Badge, StatusDot, and ConnectionStatus
9. Callout and InlineMessage
10. Dialog
11. Tooltip
12. CopyPopover and CopyValue
13. DataTable
14. Disclosure and EventLogRow
15. ProgressiveReveal
16. Stat, MetricGrid, and ValuePair
17. CodeBlock and SecretValue
18. Plot
19. AppShell and StickyChrome
20. Empty, Loading, Error, and Stale states

Added after the initial twenty: a docked Inspector, governed by the overlay rule below.

Existing PRN examples remain in the same file so the visual history and newer migration-ready contracts can be compared in one place.

## Hierarchical expansion

Every PermissionChecklist branch has a separate `[-]` / `[+]` button, initially
expanded. Native button activation works with pointer, touch, Enter and Space.
`aria-expanded` and `aria-controls` identify the visible child list; the accessible
name includes the branch name. Collapsed descendants leave the focus order.
Collapsing never changes permission selection, aggregate counts or nested
expansion choices. Parent checkboxes and per-kind bulk actions still operate on
all descendants, including hidden ones. Without JavaScript all leaves stay visible.

## Live reading

Card `33` composes a synthetic source, a semantic table, and reading controls.
Start the source for an observation every two seconds, or send observations
manually. It makes no network requests and starts stopped.

- A changing surface preserves selected text, keyboard focus, and internal scroll
  position. On an incoming change, selection intersecting the table, focus within
  its viewport, or scrolling away from either origin holds its displayed observation.
- A manual hold is available. A held surface retains only the newest replacement,
  not an unbounded queue. Leaving the surface never silently resumes it.
- **Show latest observation** applies that replacement, clears only selection
  intersecting this surface, resets its internal scroll, and preserves action focus.
- Source state and reading state are independent: a stopped source is not an
  error, and a held table does not stop incoming observations or other surfaces.
- Announce changes of reading state without announcing every incoming sample.
  Use stable row identities and change only text whose value changed.

This is a presentation contract, not a transport or data-model API. Consumers
must label the observation being displayed; current source activity cannot make
a held observation current. Keep actions requiring current evidence separately
qualified. Test selection across cell boundaries, horizontal scrolling, keyboard
focus, and explicit resume together, not just individual controls in isolation.

## Overlay rule

- Use a Tooltip only for short, noninteractive supplementary help.
- Use a CopyPopover for one compact value that must be selected or copied.
- Use a docked Inspector for structured details, links, tables, or anything a
  person may need to read while keeping the inspected surface visible.

An Inspector always owns reserved layout space. Hover or focus previews a
target, click pins it, and Escape or the clear button releases it. Its position
never follows the pointer and it never covers the content being inspected.

## Assumptions and design decisions

- **Assumed:** this repository owns only the PRN specimen; Dise integration is deliberately deferred.
- **Assumed:** the rich invocation-route picker is the justified custom-listbox example; ordinary single-choice fields continue to prefer native `select`.
- **Assumed:** a canvas plot is appropriate because the complete textual summary and keyboard cursor expose the same information without pointer or colour.
- **Assumed:** scope selection is demonstration-local. A future migration may retain independent selected repositories, profiles, or streams in sibling modes.
- Tooltip is noninteractive supplementary help. Exact technical values use the separately focusable CopyValue/CopyPopover contract.
- Dialogs use one shared focus, Escape, backdrop, scroll-lock, and focus-restoration implementation.
- Dense tables remain semantic tables inside bounded horizontal scroll regions; they are not converted into cards on narrow screens.
- Dropdown menus share the chamfer language: the edge facing the trigger is squared and attaches flush, the far corners carry the octagon cut, and the cut flips with the menu near viewport edges.
- Motion communicates state only and is disabled under `prefers-reduced-motion` without hiding the textual state.
- Page and programmatic scrolling are smooth, falling back to instant under `prefers-reduced-motion`.
- Continuous animations use only transform and opacity, and pointer-following work (tooltip, plot cursor) is coalesced to one update per frame.

## Repository layout

```text
prnui.html                 component specimen and behavior
favicon.svg                shared browser and Android icon source
android/                   offline Android app, build, and device tests
README.md                  component inventory and operating notes
FEATURE-DEMO.md            human/agent verification script
test/prnui.test.mjs        zero-dependency structural contract tests
```
