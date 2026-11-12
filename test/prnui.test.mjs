import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../prnui.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
const visibleText = html
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]+>/g, ' ');

test('the specimen is self-contained and offline-safe', () => {
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+(?:stylesheet|preconnect)/i);
  assert.doesNotMatch(html, /@import\s/i);
  assert.doesNotMatch(html, /url\(\s*["']?https?:/i);
  assert.match(html, /Ubuntu[^;]+Ubuntu Sans[^;]+system-ui/);
});

test('all twenty migration component families have semantic demos', () => {
  const components = [
    'Card', 'Panel', 'Button', 'Field', 'TextInput', 'PasswordInput', 'Select', 'Listbox',
    'Checkbox', 'PermissionChecklist', 'Tabs', 'SegmentedControl', 'ScopeSwitcher', 'Badge',
    'StatusDot', 'ConnectionStatus', 'Callout', 'InlineMessage', 'Dialog', 'Tooltip',
    'CopyPopover', 'CopyValue', 'DataTable', 'Disclosure', 'EventLogRow', 'ProgressiveReveal',
    'Stat', 'MetricGrid', 'ValuePair', 'CodeBlock', 'SecretValue', 'Plot', 'AppShell', 'StickyChrome', 'Inspector', 'DockedInspector',
    'Empty', 'Loading', 'Error', 'Stale'
  ];
  for (const component of components) {
    assert.match(html, new RegExp(`data-component="[^"]*\\b${component}\\b`), `missing ${component} demo`);
  }
});

test('interactive primitives expose their accessibility contracts', () => {
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"[^>]+aria-selected=/);
  assert.match(html, /aria-controls="shellStreamsPanel"/);
  assert.match(html, /aria-haspopup="listbox"/);
  assert.match(html, /role="listbox"/);
  assert.match(html, /role="option"[^>]+aria-selected=/);
  assert.match(html, /role="dialog"[^>]+aria-modal="true"/);
  assert.match(html, /role="tooltip"[^>]+aria-hidden="true"/);
  assert.match(html, /<details class="event-row"/);
  assert.match(html, /<summary class="event-summary"/);
  assert.match(html, /<canvas[^>]+tabindex="0"[^>]+aria-describedby="plotSummary"/);
});

test('the rich listbox escapes chamfer clipping through a page-level menu portal', () => {
  assert.match(html, /body\.appendChild\(menu\)/);
  assert.match(html, /listbox\.appendChild\(menu\)/);
  assert.match(html, /\.listbox-menu\.open\s*\{\s*display:\s*block/);
  assert.match(html, /closeListbox\(\)/);
});

test('the dropdown menu wears the chamfer with a squared edge toward its trigger', () => {
  assert.match(html, /\.listbox-menu--down\s*\{\s*clip-path:\s*polygon\(0 0, 100% 0/);
  assert.match(html, /\.listbox-menu--up\s*\{\s*clip-path:\s*polygon\(var\(--cut\) 0/);
  assert.match(html, /listbox-menu-scroll/);
  assert.match(html, /listbox-option-label/);
});

test('permission checklists reuse the hierarchical checkbox primitive', () => {
  const permissionRows = [...html.matchAll(/<label class="permission-row[^"]*">([\s\S]*?)<\/label>/g)];
  assert.ok(permissionRows.length >= 2);
  for (const [, row] of permissionRows) {
    assert.match(row, /class="tree-input"/);
    assert.match(row, /class="tree-box"/);
  }
});

test('branch diamonds style partial and all aggregate states for both permission types', () => {
  for (const [kind, color] of [['readonly', 'green'], ['mutable', 'orange']]) {
    for (const state of ['partial', 'all']) {
      const rule = new RegExp(`data-${kind}-state="${state}"[^}]*var\\(--${color}\\)`, 's');
      assert.match(html, rule, `missing ${kind}/${state} aggregate styling`);
    }
  }
  const typedLeaves = [...html.matchAll(/tree-label--(readonly|mutable)">\s*<input[^>]+data-kind="(readonly|mutable)"/g)];
  assert.ok(typedLeaves.length > 0);
  for (const [, labelKind, inputKind] of typedLeaves) assert.equal(labelKind, inputKind);
});

test('the permission tree scrolls within its own bounded region when narrow', () => {
  assert.match(html, /\.checktree-scroll\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(html, /<div class="checktree-scroll" tabindex="0"/);
});

test('top-level specimen cards receive stable two-digit side references', () => {
  const refs = [...html.matchAll(/data-section-ref="(\d{2})"/g)].map(match => match[1]);
  const expected = [...Array.from({ length: 17 }, (_, index) => String(index + 1).padStart(2, '0')),
    ...Array.from({ length: 12 }, (_, index) => String(index + 20).padStart(2, '0')), '33'];
  assert.deepEqual(refs, expected);
  assert.doesNotMatch(html, /data-section-ref="(?:18|19)"/);
  assert.match(html, /content:\s*attr\(data-section-ref\)/);
});

test('chamfered buttons keep every visible label above their surface', () => {
  assert.doesNotMatch(html, /<button class="chamfer btn[^>]*>[^<\s]/);
});

test('SecretValue reveal state reserves stable button and value geometry', () => {
  assert.match(html, /\.secret-toggle\s*\{\s*width:\s*82px/);
  assert.match(html, /\.secret-text\s*\{[^}]*min-height:[^;}]+;[^}]*margin-top:\s*12px/s);
});

test('multiline tooltip triggers pin a separately interactive copy popover', () => {
  assert.match(html, /data-copy-items=/);
  assert.match(html, /copy-line-button/);
  assert.match(html, /copyPopoverCombinedValue/);
});

test('dense data remains semantic and has explicit state rows', () => {
  assert.match(html, /<table class="data-table data-table--dense">/);
  assert.match(html, /<caption class="sr-only">Synthetic invocation routes<\/caption>/);
  assert.match(html, /<th scope="col">Invocation<\/th>/);
  assert.match(html, /No retained results/);
  assert.match(html, /Loading table/);
  assert.match(html, /Previously loaded rows remain visible/);
  assert.match(html, /id="loadInvocations"/);
  assert.doesNotMatch(html, /activity-ellipsis/);
});

test('behavior source contains the required keyboard and focus operations', () => {
  const script = scripts.join('\n');
  for (const key of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', 'Escape', 'Tab']) {
    assert.match(script, new RegExp(`['"]${key}['"]`), `missing ${key} behavior`);
  }
  assert.match(script, /aria-activedescendant/);
  assert.match(script, /dialogOpener/);
  assert.match(script, /focusableSelector/);
  assert.match(script, /navigator\.clipboard/);
  assert.match(script, /document\.execCommand\('copy'\)/);
  assert.match(script, /ResizeObserver/);
});

test('inline JavaScript parses without a build step', () => {
  assert.equal(scripts.length, 1);
  for (const source of scripts) assert.doesNotThrow(() => new Function(source));
});

test('responsive and reduced-motion contracts are present', () => {
  assert.match(html, /@media \(max-width: 520px\)/);
  assert.match(html, /@media \(max-width: 720px\)/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /\.data-table-viewport\s*\{[^}]*overflow:\s*auto/s);
  assert.match(html, /\.dialog-actions\s*\{[^}]*flex-direction:\s*column-reverse/s);
});

test('scrolling is smooth and falls back to instant under reduced motion', () => {
  assert.match(html, /html\s*\{\s*scroll-behavior:\s*smooth/);
  assert.match(html, /scroll-behavior:\s*auto/);
  assert.match(html, /scrollBehavior\(\)/);
});

test('continuous animations animate only compositor-friendly properties', () => {
  const keyframeBody = name => {
    const start = html.indexOf(`@keyframes ${name}`);
    assert.ok(start >= 0, `missing @keyframes ${name}`);
    let depth = 0;
    let index = html.indexOf('{', start);
    const open = index;
    for (; index < html.length; index += 1) {
      if (html[index] === '{') depth += 1;
      else if (html[index] === '}' && (depth -= 1) === 0) break;
    }
    return html.slice(open, index);
  };
  for (const name of ['dot-pulse', 'wf-pulse', 'skeleton-shift', 'spin']) {
    assert.doesNotMatch(keyframeBody(name), /box-shadow|filter|background/, `${name} animates paint-heavy properties`);
  }
});

test('demo identities and machine values are unmistakably synthetic', () => {
  assert.match(html, /Synthetic capability token/);
  assert.match(html, /repo_demo_/);
  assert.match(html, /job_demo_/);
  assert.match(html, /jobs\.events/);
  assert.doesNotMatch(html, /0x[a-fA-F0-9]{20,}/);
  assert.doesNotMatch(html, /(?:sk|pk)_[a-zA-Z0-9]{20,}/);
});

test('the default palette stays dark, and light is opt-in', () => {
  assert.doesNotMatch(html, /<html[^>]*\sdata-theme=/);
  const root = html.slice(html.indexOf(':root {'), html.indexOf('/* Light palette'));
  for (const token of ['--bg:        #0d1117', '--surface:   #161b22', '--text:      #e6edf3', '--cyan:      #58a6ff']) {
    assert.ok(root.includes(token), `dark default lost ${token}`);
  }
  const lightStart = html.indexOf('html[data-theme="light"] {');
  const lightEnd = html.indexOf('@media (prefers-color-scheme: light)', lightStart);
  const light = html.slice(lightStart, lightEnd);
  const systemStart = html.indexOf('html[data-theme="system"] {');
  const system = html.slice(systemStart, html.indexOf('}', systemStart));
  const declarations = block => [...block.matchAll(/--[a-z-]+:\s*[^;]+;/g)].map(match => match[0]);
  assert.deepEqual(declarations(light), declarations(system));
  assert.ok(light.includes('--bg: #f6f8fa'));
  assert.ok(light.includes('color-scheme: light'));
  for (const choice of ['system', 'light', 'dark']) {
    assert.match(html, new RegExp(`data-theme-choice="${choice}"`));
  }
  assert.match(html, /prnui:theme/);
  assert.match(html, /prnui-theme/);
});

test('the specimen vocabulary stays in repository automation and structured-stream domains', () => {
  assert.doesNotMatch(visibleText, /\b(?:trade|trader|trading|wallet|portfolio|exchange|broker|quote|bid|ask|market|position|execution|price|equity|leverage|instrument|placing|filled|buy|sell|spread|capital|balance|money)\b/i);
});
