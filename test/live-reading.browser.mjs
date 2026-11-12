import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import test from 'node:test';

// Real DOM selection, focus and scroll need a browser, not markup assertions.
test('live reading and hierarchical expansion preserve independent state', { timeout: 30000 }, async t => {
  const profile = await mkdtemp(join(tmpdir(), 'prnui-reading-'));
  const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let socket;
  const exited = new Promise(resolve => {
    chrome.once('exit', resolve);
    chrome.once('error', resolve);
  });
  t.after(async () => {
    socket?.close();
    chrome.kill('SIGKILL');
    await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Chrome debugging startup timed out')), 10000);
    chrome.once('error', error => { clearTimeout(timeout); reject(error); });
    chrome.once('exit', () => { clearTimeout(timeout); reject(new Error('Chrome exited before startup')); });
    chrome.stderr.on('data', chunk => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  socket = new WebSocket(endpoint);
  await once(socket, 'open');
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data), request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  function command(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => command(method, params, sessionId);
  async function evaluate(expression) {
    const result = await page('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await page('Page.navigate', { url: new URL('../prnui.html', import.meta.url).href });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate('document.querySelectorAll("#readingBody tr").length === 12')) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(await evaluate('document.querySelectorAll("#readingBody tr").length'), 12);
  await evaluate(`window.reading = {
    next: document.getElementById('readingNext'), resume: document.getElementById('readingResume'),
    hold: document.getElementById('readingHold'), viewport: document.getElementById('readingViewport'),
    revision: document.getElementById('readingRevision'), status: document.getElementById('readingStatus'),
    first: document.querySelector('#readingBody tr'), source: document.getElementById('readingSource')
  }`);
  const revision = () => evaluate('Number(reading.revision.textContent)');
  await evaluate('reading.next.click()');
  assert.equal(await revision(), 2);
  // Focus alone holds on arrival; blurring does not silently resume.
  await evaluate('reading.viewport.focus(); reading.next.click(); reading.viewport.blur(); reading.next.click()');
  assert.equal(await revision(), 2);
  assert.equal(await evaluate('reading.status.dataset.held'), 'true');
  await evaluate('reading.resume.focus()');
  await page('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await page('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await revision(), 4);
  assert.equal(await evaluate('document.activeElement === reading.resume'), true);
  await evaluate('reading.next.click()');
  assert.equal(await revision(), 5);
  // Selection spanning cells survives multiple arrivals and the newest wins.
  const selected = await evaluate(`(() => {
    const range = document.createRange();
    range.setStart(reading.first.cells[0].firstChild, 2);
    range.setEnd(reading.first.cells[1].firstChild, 2);
    getSelection().removeAllRanges(); getSelection().addRange(range);
    return getSelection().toString();
  })()`);
  await evaluate('reading.next.click(); reading.next.click(); reading.next.click()');
  assert.equal(await revision(), 5);
  assert.equal(await evaluate('getSelection().toString()'), selected);
  await evaluate('reading.resume.click()');
  assert.equal(await revision(), 8);
  assert.equal(await evaluate('getSelection().isCollapsed'), true);
  assert.equal(await evaluate('reading.first === document.querySelector("#readingBody tr")'), true);
  // Either scroll axis protects reading; resuming resets both.
  await page('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate('reading.viewport.scrollLeft = 50; reading.next.click()');
  assert.equal(await revision(), 8);
  await evaluate('reading.resume.click(); reading.viewport.scrollTop = 40; reading.next.click()');
  assert.equal(await revision(), 9);
  await evaluate('reading.resume.click()');
  assert.equal(await revision(), 10);
  assert.deepEqual(await evaluate('[reading.viewport.scrollTop, reading.viewport.scrollLeft]'), [0, 0]);
  // An unrelated selection neither blocks updates nor gets cleared on resume.
  const outside = await evaluate(`(() => {
    const range = document.createRange(); range.selectNodeContents(document.querySelector('h1'));
    getSelection().addRange(range); return getSelection().toString();
  })()`);
  await evaluate('reading.next.click(); reading.hold.click(); reading.resume.click()');
  assert.equal(await revision(), 11);
  assert.equal(await evaluate('getSelection().toString()'), outside);
  // Continuous source is independent of manual hold and can be stopped.
  await evaluate('reading.hold.click(); reading.source.click()');
  await new Promise(resolve => setTimeout(resolve, 2200));
  await evaluate('reading.source.click()');
  assert.equal(await revision(), 11);
  assert.equal(await evaluate('reading.source.getAttribute("aria-pressed")'), 'false');
  await evaluate('reading.resume.click()');
  assert.ok(await revision() > 11);
  await evaluate(`document.querySelector('#component-live-reading details').open = true`);
  await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate('getSelection().removeAllRanges(); reading.next.click()');
  assert.equal(await evaluate(`document.querySelector('#component-live-reading details').open`), true);
  for (const width of [320, 390, 1280]) {
    await page('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false });
    assert.equal(await evaluate(`(() => {
      const card = document.getElementById('component-live-reading');
      return card.scrollWidth <= card.clientWidth && reading.viewport.scrollWidth > 0;
    })()`), true, `live reading fits at ${width}px`);
  }
  // Expansion is independent of selection, including bulk changes while hidden.
  await evaluate(`window.treeDemo = {
    root: document.querySelector('[data-checktree] .tree-expand'),
    nested: document.querySelectorAll('[data-checktree] .tree-expand')[1],
    tree: document.querySelector('[data-checktree]')
  }`);
  const selections = () => evaluate(`[...treeDemo.tree.querySelectorAll('.tree-leaf input')].map(n => n.checked)`);
  const beforeCollapse = await selections();
  await evaluate('treeDemo.nested.click(); treeDemo.root.click(); treeDemo.root.click()');
  assert.equal(await evaluate('treeDemo.nested.getAttribute("aria-expanded")'), 'false');
  assert.deepEqual(await selections(), beforeCollapse);
  assert.equal(await evaluate(`document.getElementById(treeDemo.nested.getAttribute('aria-controls')).hidden`), true);
  await evaluate('treeDemo.nested.focus()');
  await page('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await page('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate('getComputedStyle(treeDemo.nested.querySelector(".tree-expand-vertical")).display'), 'none');
  await page('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', text: ' ', windowsVirtualKeyCode: 32 });
  await page('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  assert.notEqual(await evaluate('getComputedStyle(treeDemo.nested.querySelector(".tree-expand-vertical")).display'), 'none');
  assert.equal(await evaluate('treeDemo.nested.textContent'), '');
  assert.equal(await evaluate('document.activeElement === treeDemo.nested'), true);
  await evaluate(`treeDemo.root.click(); treeDemo.tree.querySelector('.tree-parent').click()`);
  assert.equal(await evaluate(`[...treeDemo.tree.querySelectorAll('.tree-leaf input')].every(n => n.checked)`), true);
  await evaluate(`treeDemo.tree.querySelector('[data-tree-kind="readonly"]').click()`);
  assert.equal(await evaluate(`[...treeDemo.tree.querySelectorAll('.tree-leaf input[data-kind="readonly"]')].every(n => !n.checked)`), true);
  assert.equal(await evaluate(`[...treeDemo.tree.querySelectorAll('.tree-leaf input[data-kind="mutable"]')].every(n => n.checked)`), true);
  assert.equal(await evaluate('treeDemo.root.getAttribute("aria-expanded")'), 'false');
  await page('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await page('Emulation.setTouchEmulationEnabled', { enabled: true });
  await evaluate(`treeDemo.root.scrollIntoView({ block: 'center', behavior: 'instant' })`);
  const point = await evaluate(`(() => { const r = treeDemo.root.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  const beforeTouch = await selections();
  await page('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await page('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await evaluate('treeDemo.root.getAttribute("aria-expanded")'), 'true');
  assert.deepEqual(await selections(), beforeTouch);
  if (process.env.PRNUI_SCREENSHOT) {
    await page('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate(`document.getElementById('component-live-reading').scrollIntoView({ behavior: 'instant' })`);
    const { data } = await page('Page.captureScreenshot', { format: 'png' });
    await writeFile(process.env.PRNUI_SCREENSHOT, Buffer.from(data, 'base64'));
  }
});
