package io.github.dkorolev.prnui;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.ClipboardManager;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.webkit.WebView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Arrays;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@RunWith(AndroidJUnit4.class)
public class MainActivityTest {
    private ActivityScenario<MainActivity> scenario;

    @Before
    public void launch() throws Exception {
        scenario = ActivityScenario.launch(MainActivity.class);
        await("document.readyState === 'complete' && typeof copyText === 'function'");
    }

    @After
    public void close() {
        if (scenario != null) scenario.close();
    }

    private String evaluate(String script) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(activity -> {
            WebView webView = activity.findViewById(android.R.id.primary);
            webView.evaluateJavascript(script, value -> {
                result.set(value);
                complete.countDown();
            });
        });
        assertTrue("JavaScript callback timed out", complete.await(10, TimeUnit.SECONDS));
        return result.get();
    }

    private void await(String condition) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < deadline) {
            if ("true".equals(evaluate(condition))) return;
            Thread.sleep(100);
        }
        assertEquals(condition, "true", evaluate(condition));
    }

    private void back() {
        scenario.onActivity(activity -> activity.getOnBackPressedDispatcher().onBackPressed());
    }

    private void tap(String selector) throws Exception {
        String element = "document.querySelector(" + JSONObject.quote(selector) + ")";
        JSONArray point = new JSONArray(evaluate("(() => { const r = " + element
                + ".getBoundingClientRect(); return [(r.left + r.width / 2) * devicePixelRatio,"
                + " (r.top + r.height / 2) * devicePixelRatio]; })()"));
        int[] origin = new int[2];
        scenario.onActivity(activity -> activity.findViewById(android.R.id.primary).getLocationOnScreen(origin));
        float x = (float) point.getDouble(0) + origin[0];
        float y = (float) point.getDouble(1) + origin[1];
        long downTime = SystemClock.uptimeMillis();
        for (int action : new int[] {MotionEvent.ACTION_DOWN, MotionEvent.ACTION_UP}) {
            MotionEvent event = MotionEvent.obtain(downTime, SystemClock.uptimeMillis(), action, x, y, 0);
            event.setSource(InputDevice.SOURCE_TOUCHSCREEN);
            InstrumentationRegistry.getInstrumentation().sendPointerSync(event);
            event.recycle();
        }
    }

    @Test
    public void bundledPageLoadsWithoutNetworkPermission() throws Exception {
        assertEquals("\"PRN UI Component System\"", evaluate("document.title"));
        assertEquals("true", evaluate("isSecureContext"));
        assertEquals("true", evaluate("document.querySelectorAll('[data-section-ref]').length > 20"));
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String[] permissions = context.getPackageManager()
                .getPackageInfo(context.getPackageName(), PackageManager.GET_PERMISSIONS).requestedPermissions;
        assertFalse(permissions != null && Arrays.asList(permissions).contains("android.permission.INTERNET"));
        assertNotNull(context.getPackageManager().getApplicationIcon(context.getPackageName()));
    }

    @Test
    public void tabsAndCheckboxesRespond() throws Exception {
        evaluate("document.getElementById('shellJobsTab').click()");
        assertEquals("true", evaluate("!document.getElementById('shellJobsPanel').hidden"));
        evaluate("window.leaf = document.querySelector('.tree-leaf .tree-input');"
                + "window.wasChecked = leaf.checked; leaf.click()");
        assertEquals("true", evaluate("leaf.checked !== wasChecked"));
    }

    @Test
    public void backDismissesDialogAndRestoresFocus() throws Exception {
        evaluate("document.getElementById('openTokenDialog').click()");
        await("document.getElementById('tokenDialog').contains(document.activeElement)");
        back();
        await("!document.getElementById('tokenDialog').classList.contains('open')");
        await("document.activeElement.id === 'openTokenDialog'");
        assertEquals("false", evaluate("document.body.classList.contains('dialog-open')"));
    }

    @Test
    public void backDismissesListboxEvenWithoutTriggerFocus() throws Exception {
        evaluate("document.querySelector('.listbox-trigger').click()");
        await("document.querySelector('.listbox-menu.open') !== null");
        back();
        await("document.querySelector('.listbox-menu.open') === null");
        assertEquals("\"false\"", evaluate("document.querySelector('.listbox-trigger').getAttribute('aria-expanded')"));
    }

    @Test
    public void copyUsesAndroidClipboardAndBackDismissesPopover() throws Exception {
        String expected = new JSONArray("[" + evaluate(
                "document.querySelector('[data-copy-value]').dataset.copyValue") + "]").getString(0);
        evaluate("document.querySelector('[data-copy-value]').scrollIntoView({behavior: 'instant', block: 'center'})");
        tap("[data-copy-value]");
        await("document.activeElement.id === 'copyPopover'");
        // Clipboard access requires an actual user gesture, not evaluateJavascript.
        tap(".copy-popover-copy");
        await("document.getElementById('copyPopoverFeedback').textContent === 'Copied'");
        scenario.onActivity(activity -> {
            ClipboardManager clipboard = (ClipboardManager) activity.getSystemService(Context.CLIPBOARD_SERVICE);
            assertNotNull(clipboard.getPrimaryClip());
            assertEquals(expected,
                    clipboard.getPrimaryClip().getItemAt(0).coerceToText(activity).toString());
        });
        back();
        await("!document.getElementById('copyPopover').classList.contains('open')");
    }

    @Test
    public void rotationKeepsLiveUiState() throws Exception {
        evaluate("document.getElementById('demoAlias').value = 'kept through rotation';"
                + "window.rotationMarker = 'same page'");
        scenario.onActivity(activity -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        await("innerWidth > innerHeight");
        assertEquals("\"kept through rotation\"", evaluate("document.getElementById('demoAlias').value"));
        assertEquals("\"same page\"", evaluate("window.rotationMarker"));
        scenario.onActivity(activity -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        await("innerHeight > innerWidth");
    }

    @Test
    public void unbundledRequestsCannotReachNetwork() throws Exception {
        evaluate("fetch('https://example.com/').then(r => window.blockedStatus = r.status)"
                + ".catch(() => window.blockedStatus = 'network denied')");
        await("window.blockedStatus === 403 || window.blockedStatus === 'network denied'");
        assertEquals("\"PRN UI Component System\"", evaluate("document.title"));
    }
}
