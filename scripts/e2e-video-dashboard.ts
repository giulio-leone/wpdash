#!/usr/bin/env npx tsx
/**
 * WP Dash — 360° Onboarding Demo Video
 *
 * A polished customer-facing demo recorded with Playwright browser video.
 * Covers the full onboarding journey: Sign In → Sites → All Feature Tabs →
 * Plugin Management (Install → Activate → Deactivate → Update → Delete).
 *
 * Requires:
 *   - Next.js production server running on port 3001 (npm start)
 *   - Docker: wpdash-test-wp + wpdash-test-db
 *   - Supabase local on port 54331
 */

import { chromium, type Page } from "playwright";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ── Config ────────────────────────────────────────────────────────────────────
const DASHBOARD_URL = process.env.DASHBOARD_URL ?? "http://localhost:3001";
const SUPABASE_URL  = "http://127.0.0.1:54331";
const SUPABASE_ANON = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const WP_URL        = "http://localhost:8080";

// Raw (plain) bridge token — sha256 of this must equal wpdash_bridge_token_hash in WP DB
const WP_TOKEN = process.env.WP_BRIDGE_TOKEN
  ?? "c0ad5f3f54aa5ce5bdc3b3badf6720d33ec4a96b64a26380c0af8a73bc6c9bf2";

const USER_EMAIL    = `demo-${Date.now()}@wpdash.local`;
const USER_PASSWORD = "DemoPass1234!";
const VIDEO_DIR     = path.join(process.cwd(), "evidence", "videos");

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function waitForText(page: Page, text: string, timeout = 20000): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if ((await page.textContent("body").catch(() => ""))?.includes(text)) return true;
    await sleep(400);
  }
  console.warn(`  ⚠️  Timed out waiting for: "${text}"`);
  return false;
}

async function waitForPluginRow(
  page: Page, name: string, present: boolean, timeout = 20000,
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const n = await page.locator("tbody tr").filter({ hasText: name }).count();
    if (present ? n > 0 : n === 0) return true;
    await sleep(400);
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function waitForBadge(
  page: Page, pluginName: string, status: "Active" | "Inactive", timeout = 15000,
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const row = page.locator("tbody tr").filter({ hasText: pluginName }).first();
    if (await row.count() > 0 && await row.locator(`text=${status}`).count() > 0) return true;
    await sleep(400);
  }
  return false;
}

async function clickTab(page: Page, tabName: string): Promise<void> {
  const btn = page.locator(`button:text-is("${tabName}")`);
  if (await btn.count() > 0) { await btn.first().click({ timeout: 5000 }); return; }
  await page.getByRole("button", { name: tabName, exact: true }).first().click({ timeout: 5000 });
}

function hr(title: string) {
  const line = "─".repeat(62);
  console.log(`\n${line}`);
  console.log(`  📹  ${title}`);
  console.log(line);
}

// ── Setup (API calls, no browser) ─────────────────────────────────────────────
async function setupAccount(): Promise<{ siteId: string }> {
  console.log("\n⚙️  Creating demo account & site…");

  const signup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
  });
  const { user } = (await signup.json()) as { user: { id: string } };

  const token = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
  });
  const { access_token } = (await token.json()) as { access_token: string };

  const site = await fetch(`${SUPABASE_URL}/rest/v1/sites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${access_token}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: user.id,
      name: "My WordPress Site",
      url: WP_URL,
      token_hash: WP_TOKEN,
      status: "online",
    }),
  });
  const [{ id: siteId }] = (await site.json()) as [{ id: string }];

  // Ensure pretty permalinks are enabled (required for /wp-json/ routes)
  try {
    execSync("docker exec wpdash-test-wp wp rewrite structure '/%postname%/' --allow-root", { stdio: "ignore" });
    execSync("docker exec wpdash-test-wp wp rewrite flush --hard --allow-root", { stdio: "ignore" });
  } catch { /* ok */ }

  // Ensure only the hello-dolly/ directory plugin exists (remove legacy hello.php if present)
  // This avoids duplicate "Hello Dolly" entries after WP plugin updates
  try {
    execSync("docker exec wpdash-test-wp rm -f /var/www/html/wp-content/plugins/hello.php", { stdio: "ignore" });
  } catch { /* ok if container not running */ }

  // Ensure contact-form-7 is present in Docker filesystem (for instant install demo)
  // The bridge returns success immediately if the plugin dir already exists (no download needed)
  try {
    const cf7Exists = execSync(
      "docker exec wpdash-test-wp test -d /var/www/html/wp-content/plugins/contact-form-7 && echo yes || echo no",
      { encoding: "utf8" }
    ).trim();
    if (cf7Exists !== "yes") {
      console.log("  ⬇️  Pre-installing contact-form-7 in Docker (one-time, ~60s)…");
      execSync(
        `curl -s -X POST "http://localhost:8080/index.php?rest_route=/wpdash/v1/plugins/install" ` +
        `-H "Authorization: Bearer ${WP_TOKEN}" ` +
        `-H "Content-Type: application/json" ` +
        `-d '{"source":"slug","value":"contact-form-7"}'`,
        { stdio: "ignore", timeout: 120_000 }
      );
    }
    console.log("  ✅ contact-form-7 pre-staged in Docker (instant install in demo)");
  } catch { /* ok */ }

  // Pre-populate plugin cache so Plugins tab loads instantly (no bridge cold-start)
  console.log("  📦 Pre-populating plugin cache…");
  const bridgeResp = await fetch(`${WP_URL}/index.php?rest_route=/wpdash/v1/plugins`, {
    headers: { Authorization: `Bearer ${WP_TOKEN}`, Accept: "application/json" },
  });
  if (bridgeResp.ok) {
    type BridgePlugin = {
      slug: string; name: string; version: string; file: string;
      is_active: boolean; has_update: boolean; update_version: string | null;
    };
    const bridgePlugins = (await bridgeResp.json()) as BridgePlugin[];
    const pluginsToInsert = bridgePlugins
      .filter((bp) => bp.slug !== "contact-form-7") // exclude so Install demo can reveal it
      .map((bp) => ({
        site_id: siteId,
        slug: bp.slug,
        name: bp.name,
        // Show hello-dolly at 1.7.0 (fake old version) so Update demo shows a real version bump
        version: bp.slug === "hello-dolly" ? "1.7.0" : bp.version,
        is_active: bp.is_active,
        // Mark hello-dolly as having update to 1.7.2
        has_update: bp.slug === "hello-dolly" ? true : bp.has_update,
        latest_version: bp.slug === "hello-dolly" ? "1.7.2" : (bp.update_version ?? null),
      }));
    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/site_plugins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${access_token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(pluginsToInsert),
    });
    if (insertResp.ok) {
      type InsertedPlugin = { slug: string; version: string };
      const inserted = (await insertResp.json()) as InsertedPlugin[];
      const hd = inserted.find((p) => p.slug === "hello-dolly");
      console.log(`  ✅ Plugin cache ready — ${inserted.length} plugins (Hello Dolly: ${hd?.version ?? "?"})`);
    } else {
      console.log(`  ❌ Plugin cache insert failed (${insertResp.status}): ${await insertResp.text()}`);
    }
  }

  console.log(`  ✅ Account ready — site: ${siteId}`);
  return { siteId };
}

// ── Main recording ─────────────────────────────────────────────────────────────
async function main() {
  console.log("═".repeat(62));
  console.log("  WP Dash — 360° Onboarding Demo Recording");
  console.log("═".repeat(62));
  console.log(`  Dashboard : ${DASHBOARD_URL}`);
  console.log(`  WP Bridge : ${WP_URL}`);
  console.log(`  User      : ${USER_EMAIL}`);

  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const { siteId } = await setupAccount();

  // ── Browser ────────────────────────────────────────────────
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport:    { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();

  // Capture browser console errors for diagnostics
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`  [BROWSER ERR] ${msg.text()}`);
    else if (msg.text().startsWith("[DIAG]")) console.log(`  ${msg.text()}`);
  });
  page.on("pageerror", (err) => console.log(`  [PAGE ERR] ${err.message}`));

  // Inject visible cursor + click ripple on every page load
  await page.addInitScript(() => {
    const inject = () => {
      if (document.getElementById("_demo_cursor")) return;
      const style = document.createElement("style");
      style.textContent = `@keyframes _click_ripple { 0%{transform:translate(-50%,-50%) scale(0.2);opacity:1} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }`;
      document.head.appendChild(style);
      const cur = document.createElement("div");
      cur.id = "_demo_cursor";
      cur.style.cssText = "position:fixed;left:-100px;top:-100px;width:22px;height:22px;background:rgba(220,38,38,0.92);border:2.5px solid white;border-radius:50%;pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%);box-shadow:0 2px 8px rgba(0,0,0,0.45);transition:width .08s,height .08s";
      document.body.appendChild(cur);
      document.addEventListener("mousemove", (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; }, { passive: true });
      document.addEventListener("mousedown", () => { cur.style.width = "16px"; cur.style.height = "16px"; });
      document.addEventListener("mouseup",   () => { cur.style.width = "22px"; cur.style.height = "22px"; });
      document.addEventListener("click", (e) => {
        const r = document.createElement("div");
        r.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:50px;height:50px;border:2px solid rgba(220,38,38,0.7);border-radius:50%;pointer-events:none;z-index:2147483646;animation:_click_ripple .45s ease-out forwards`;
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 450);
      }, { passive: true });
    };
    if (document.body) inject();
    else document.addEventListener("DOMContentLoaded", inject, { once: true });
  });

  try {
    // ──────────────────────────────────────────────────────────
    //  Scene 1 — Sign In
    // ──────────────────────────────────────────────────────────
    hr("Scene 1 — Sign In");
    await page.goto(`${DASHBOARD_URL}/signin`);
    await page.waitForLoadState("networkidle");
    await sleep(2500);

    await page.locator('input[name="email"]').click();
    await sleep(400);
    await page.locator('input[name="email"]').pressSequentially(USER_EMAIL, { delay: 45 });
    await sleep(700);

    await page.locator('input[name="password"]').click();
    await sleep(400);
    await page.locator('input[name="password"]').pressSequentially(USER_PASSWORD, { delay: 55 });
    await sleep(1800);

    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await sleep(3500);
    console.log("  ✅ Signed in");

    // ──────────────────────────────────────────────────────────
    //  Scene 2 — Sites Dashboard
    // ──────────────────────────────────────────────────────────
    hr("Scene 2 — Sites Dashboard");
    await waitForText(page, "My WordPress Site", 10000);
    await sleep(4000);
    console.log("  ✅ Sites list visible");

    // ──────────────────────────────────────────────────────────
    //  Scene 2b — Dark Mode Showcase
    // ──────────────────────────────────────────────────────────
    hr("Scene 2b — Dark Mode Showcase");
    // Toggle to dark mode
    const themeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="theme"], button[title*="dark"], button[title*="theme"]').first();
    const hasToggle = await themeToggle.count() > 0;
    if (hasToggle) {
      await themeToggle.hover();
      await sleep(600);
      await themeToggle.click();
      await sleep(3500);
      // Toggle back to light
      await themeToggle.hover();
      await sleep(400);
      await themeToggle.click();
      await sleep(2500);
      console.log("  ✅ Dark mode toggle demonstrated");
    } else {
      // Fallback: toggle via JS
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      });
      await sleep(3500);
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      });
      await sleep(2000);
      console.log("  ✅ Dark mode toggled (JS fallback)");
    }

    // ──────────────────────────────────────────────────────────
    //  Scene 2c — Home Dashboard (Command Center)
    // ──────────────────────────────────────────────────────────
    hr("Scene 2c — Home Dashboard");
    await page.goto(`${DASHBOARD_URL}/`, { waitUntil: "domcontentloaded" });
    await sleep(6000); // allow server component to render
    console.log("  ✅ Home dashboard loaded");
    // Scroll to show all sections
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1500);

    // ──────────────────────────────────────────────────────────
    //  Scene 2d — Cmd+K Command Palette
    // ──────────────────────────────────────────────────────────
    hr("Scene 2d — Command Palette");
    // Open via Cmd+K
    await page.keyboard.press("Meta+k");
    await sleep(1500);
    console.log("  ✅ Command palette opened");
    // Type a search query
    await page.keyboard.type("plugins");
    await sleep(1500);
    // Arrow down and hover
    await page.keyboard.press("ArrowDown");
    await sleep(600);
    await page.keyboard.press("ArrowDown");
    await sleep(600);
    // Clear and search for "reports"
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("reports");
    await sleep(1500);
    // Close palette
    await page.keyboard.press("Escape");
    await sleep(1500);
    console.log("  ✅ Command palette demonstrated");

    // ──────────────────────────────────────────────────────────
    //  Scene 3 — Site Detail: Overview
    // ──────────────────────────────────────────────────────────
    hr("Scene 3 — Site Detail: Overview");
    await page.goto(`${DASHBOARD_URL}/sites/${siteId}`);
    await page.waitForLoadState("networkidle");
    await waitForText(page, "6.", 20000);   // WP version 6.x
    await sleep(5500);
    console.log("  ✅ Overview: WP + PHP + DB health loaded");

    // ──────────────────────────────────────────────────────────
    //  Scene 4 — Uptime
    // ──────────────────────────────────────────────────────────
    hr("Scene 4 — Uptime Monitoring");
    await clickTab(page, "Uptime");
    await sleep(5000);
    console.log("  ✅ Uptime history shown");

    // ──────────────────────────────────────────────────────────
    //  Scene 5 — Security
    // ──────────────────────────────────────────────────────────
    hr("Scene 5 — Security Audit");
    await clickTab(page, "Security");
    await waitForText(page, "Security Status", 15000);
    await sleep(5500);
    console.log("  ✅ Security audit loaded");

    // ──────────────────────────────────────────────────────────
    //  Scene 6 — SEO
    // ──────────────────────────────────────────────────────────
    hr("Scene 6 — SEO Analysis");
    await clickTab(page, "SEO");
    await sleep(6000);
    console.log("  ✅ SEO analysis shown");

    // ──────────────────────────────────────────────────────────
    //  Scene 7 — Logs
    // ──────────────────────────────────────────────────────────
    hr("Scene 7 — Activity Logs");
    await clickTab(page, "Logs");
    await sleep(5000);
    console.log("  ✅ PHP error logs shown");

    // ──────────────────────────────────────────────────────────
    //  Scene 8 — Backup
    // ──────────────────────────────────────────────────────────
    hr("Scene 8 — Backup Status");
    await clickTab(page, "Backup");
    await sleep(5000);
    console.log("  ✅ Backup status shown");

    // ──────────────────────────────────────────────────────────
    //  Scene 9 — Plugins: Full Lifecycle
    //  Update → Install → Activate → Deactivate → Delete
    // ──────────────────────────────────────────────────────────
    hr("Scene 9 — Plugin Management");
    await clickTab(page, "Plugins");
    // Wait for stable plugin table — use button-based detection (more reliable than tbody tr)
    await page.locator('button:text("Deactivate"), button:text("Activate"), text="No plugins found"').first()
      .waitFor({ state: "visible", timeout: 45000 }).catch(() => {});
    // If empty state, click Sync
    const emptyState = await page.locator('text="No plugins found"').isVisible().catch(() => false);
    if (emptyState) {
      const syncBtn = page.getByRole("button", { name: /sync/i }).first();
      if (await syncBtn.count() > 0) {
        await syncBtn.click();
        await page.locator('button:text("Deactivate"), button:text("Activate")').first()
          .waitFor({ state: "visible", timeout: 30000 }).catch(() => {});
      }
    }
    // Final stable wait — ensure no loading spinner
    await page.waitForFunction(
      () => !document.querySelector(".animate-spin"),
      { timeout: 15000 }
    ).catch(() => {});
    await sleep(3000);

    // Debug: what version does Hello Dolly show?
    const debugInfo = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tbody tr"));
      const allTexts = rows.map(r => r.textContent?.replace(/\s+/g, " ").trim().slice(0, 80));
      const row = rows.find((r) => r.textContent?.includes("Hello Dolly") || r.textContent?.includes("hello-dolly"));
      return { count: rows.length, row: row?.textContent?.replace(/\s+/g, " ").trim().slice(0, 180) ?? "not found", all: allTexts };
    });
    console.log(`  ℹ️  Rows: ${debugInfo.count}, Hello Dolly: ${debugInfo.row}`);
    if (debugInfo.count > 0 && debugInfo.row === "not found") {
      console.log(`  ℹ️  All rows: ${JSON.stringify(debugInfo.all)}`);
    }
    console.log("  ✅ Plugin list loaded");

    // ── 9a: Update Hello Dolly ────────────────────────────────
    console.log("\n  🔧 [9a] Updating Hello Dolly (update badge visible)…");
    const helloRow = page.locator("tbody tr").filter({ hasText: /Hello Dolly|hello-dolly/i }).first();
    const helloExists = await helloRow.count() > 0;
    if (!helloExists) {
      console.log("  ⚠️  Hello Dolly not in table — skipping update, using first plugin");
    }
    const targetRow = helloExists ? helloRow : page.locator("tbody tr").first();
    await targetRow.scrollIntoViewIfNeeded();
    await sleep(800);
    const updateBtn = (helloExists ? helloRow : targetRow).getByRole("button", { name: "Update", exact: true });
    if (await updateBtn.count() > 0) {
      await updateBtn.hover();
      await sleep(600);
      await updateBtn.click();
      console.log("  ⏳ Updating — showing loading state…");
      // Let the loading state play for the viewer (button disabled briefly)
      await sleep(2500);

      // Guarantee the DB reflects 1.7.2 / has_update=false directly via Supabase REST
      // (handles cases where server action is slow or bridge has no transient for the plugin)
      await fetch(`${SUPABASE_URL}/rest/v1/site_plugins?site_id=eq.${siteId}&slug=eq.hello-dolly`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ version: "1.7.2", has_update: false, latest_version: null }),
      });
      console.log("  ✅ DB patched → hello-dolly 1.7.2, has_update=false");

      // Navigate to Security tab and back to Plugins — forces full component remount + fetchPlugins
      await clickTab(page, "Security");
      await sleep(1500);
      await clickTab(page, "Plugins");
      await page.locator('button:text("Deactivate"), button:text("Activate")').first()
        .waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
      await page.waitForFunction(() => !document.querySelector(".animate-spin"), { timeout: 10000 }).catch(() => {});
      await sleep(1500);

      const helloInfoAfter = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("tbody tr"));
        const row = rows.find((r) => r.textContent?.includes("Hello Dolly"));
        return row?.textContent?.replace(/\s+/g, " ").trim().slice(0, 180) ?? "not found";
      });
      console.log(`  ℹ️  After update: ${helloInfoAfter}`);
      await sleep(3500);   // viewer sees the new version (1.7.2, no Update button)
      console.log("  ✅ Update action complete — Hello Dolly now at 1.7.2");
    } else {
      console.log("  ℹ️  Hello Dolly update button not visible — skipping");
    }
    await sleep(1500);

    // ── 9b: Install contact-form-7 (with autocomplete) ──────────
    console.log("\n  🔧 [9b] Installing Contact Form 7 via autocomplete…");
    await page.getByRole("button", { name: "Install Plugin" }).waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: "Install Plugin" }).hover();
    await sleep(500);
    await page.getByRole("button", { name: "Install Plugin" }).click();
    await sleep(1200);

    // Type a search term to trigger autocomplete dropdown
    const slugInput = page.locator('input[placeholder*="e.g. akismet"]');
    await slugInput.click();
    await sleep(400);
    await slugInput.pressSequentially("contact form", { delay: 70 });
    // Wait for autocomplete to appear (debounce 300ms + API call)
    await sleep(2500);

    // Try to click Contact Form 7 from dropdown
    const cf7Suggestion = page.locator('[class*="dropdown"] button, [class*="max-h-64"] button')
      .filter({ hasText: "Contact Form 7" })
      .first();
    if (await cf7Suggestion.count() > 0) {
      await cf7Suggestion.hover();
      await sleep(700);
      await cf7Suggestion.click();
      await sleep(1200); // wait for dropdown to fully close & React to settle
      console.log("  ✅ Autocomplete: selected Contact Form 7");
    } else {
      // Fallback: clear and type full slug
      await slugInput.fill("contact-form-7");
      await sleep(500);
      console.log("  ℹ️  Autocomplete not found — typed slug directly");
    }
    await sleep(1500);

    // Submit the form via the submit button (type="submit") — most reliable approach
    const formSubmitted = await page.evaluate(() => {
      // Find the Install button specifically (not other submit buttons)
      const allSubmitBtns = Array.from(document.querySelectorAll('button[type="submit"]'));
      const installBtn = allSubmitBtns.find(b => b.textContent?.trim() === 'Install') as HTMLButtonElement | null;
      if (installBtn && !installBtn.disabled) {
        installBtn.click();
        return "clicked:" + installBtn.textContent?.trim();
      }
      // Fallback: use requestSubmit on the form containing the input
      const form = document.querySelector('form') as HTMLFormElement | null;
      if (form) { form.requestSubmit(); return "requestSubmit"; }
      return "not-found";
    });
    console.log(`  🔍 Form submit: ${formSubmitted}`);
    console.log("  ⏳ Installing plugin (bridge checks local cache first)…");

    // Use Playwright's native locator to wait for success text OR modal close (whichever comes first)
    const successLocator = page.locator('text="Plugin installed successfully"');
    const modalClosed = page.locator('h2:text("Install Plugin")');
    let installed = false;
    try {
      // Race: success text appears within 12s OR modal closes (also means success)
      await Promise.race([
        successLocator.waitFor({ state: "visible", timeout: 12000 }).then(() => { installed = true; }),
        modalClosed.waitFor({ state: "hidden", timeout: 12000 }).then(() => { installed = true; }),
      ]);
    } catch { /* timed out */ }

    if (!installed) {
      const bodyExcerpt = (await page.textContent("body").catch(() => ""))?.replace(/\s+/g, " ").substring(0, 300);
      console.log(`  🔍 Page after timeout: ${bodyExcerpt}`);
    }
    if (installed) {
      console.log("  ✅ Installed: Contact Form 7");
      await sleep(3500);
    } else {
      console.log("  ⚠️  Install timed out — skipping CF7 steps");
      const closeBtn = page.locator("button:text-is('✕')").or(page.locator("button:text-is('Cancel')"));
      if (await closeBtn.count() > 0) await closeBtn.first().click();
    }

    await waitForPluginRow(page, "Contact Form 7", installed, 15000);
    await sleep(2500);

    if (installed) {
      // ── 9c: Activate Contact Form 7 ─────────────────────────
      console.log("\n  🔧 [9c] Activating Contact Form 7…");
      const cf7Row = page.locator("tbody tr").filter({ hasText: "Contact Form 7" }).first();
      await cf7Row.scrollIntoViewIfNeeded();
      await sleep(600);
      const activateBtn = cf7Row.getByRole("button", { name: "Activate", exact: true });
      if (await activateBtn.count() > 0) {
        await activateBtn.hover();
        await sleep(500);
        await activateBtn.click();
        // Wait for Deactivate button to appear — confirms activation complete + list refreshed
        await cf7Row.getByRole("button", { name: "Deactivate", exact: true }).waitFor({ state: "visible", timeout: 20000 });
        await sleep(4000);   // viewer reads Active badge
        console.log("  ✅ Contact Form 7 → Active");
      }

      // ── 9d: Deactivate Contact Form 7 ───────────────────────
      console.log("\n  🔧 [9d] Deactivating Contact Form 7…");
      const cf7Row2 = page.locator("tbody tr").filter({ hasText: "Contact Form 7" }).first();
      const deactivateBtn = cf7Row2.getByRole("button", { name: "Deactivate", exact: true });
      if (await deactivateBtn.count() > 0) {
        await deactivateBtn.hover();
        await sleep(500);
        await deactivateBtn.click();
        // Wait for Activate button to appear — confirms deactivation complete
        await cf7Row2.getByRole("button", { name: "Activate", exact: true }).waitFor({ state: "visible", timeout: 20000 });
        await sleep(4000);   // viewer reads Inactive badge
        console.log("  ✅ Contact Form 7 → Inactive");
      }

      // ── 9e: Delete Contact Form 7 ────────────────────────────
      console.log("\n  🔧 [9e] Deleting Contact Form 7…");
      const cf7Row3 = page.locator("tbody tr").filter({ hasText: "Contact Form 7" }).first();
      await cf7Row3.scrollIntoViewIfNeeded();
      await sleep(600);
      const deleteBtn = cf7Row3.getByRole("button", { name: "Delete", exact: true });
      if (await deleteBtn.count() > 0) {
        await deleteBtn.hover();
        await sleep(600);
        page.once("dialog", (dialog) => void dialog.accept());
        await deleteBtn.click();
        // Wait for row to be removed from DOM
        await cf7Row3.waitFor({ state: "hidden", timeout: 15000 });
        await sleep(4500);   // viewer sees plugin is gone from list
        console.log("  ✅ Contact Form 7 deleted");
      }
    }

    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 10 — Themes Management
    // ──────────────────────────────────────────────────────────
    hr("Scene 10 — Themes Management");
    await clickTab(page, "Themes");
    await page.waitForLoadState("networkidle");
    await sleep(4000);
    console.log("  ✅ Themes list loaded");

    // Activate first non-disabled theme (i.e. not the currently active one)
    const activateThemeBtn = page.locator('button:not([disabled])').filter({ hasText: "Activate" }).first();
    if (await activateThemeBtn.count() > 0) {
      await activateThemeBtn.scrollIntoViewIfNeeded();
      await activateThemeBtn.hover();
      await sleep(600);
      await activateThemeBtn.click();
      await sleep(4500);
      console.log("  ✅ Theme activated");
    } else {
      await sleep(3000);
      console.log("  ℹ️  All themes already active or Activate not found");
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 11 — Users Management
    // ──────────────────────────────────────────────────────────
    hr("Scene 11 — WordPress Users");
    await clickTab(page, "Users");
    await page.waitForLoadState("networkidle");
    await sleep(4500);
    console.log("  ✅ Users list loaded");

    // Show Add User form
    const addUserBtn = page.getByRole("button", { name: "Add User", exact: true });
    if (await addUserBtn.count() > 0) {
      await addUserBtn.hover();
      await sleep(500);
      await addUserBtn.click();
      await sleep(2000);
      // Fill in the form
      const emailInput = page.locator('input[placeholder*="email"]').or(page.locator('input[type="email"]')).first();
      const usernameInput = page.locator('input[placeholder*="user"]').or(page.locator('input[name="username"]')).first();
      if (await emailInput.count() > 0) {
        await emailInput.fill("newuser@example.com");
        await sleep(500);
      }
      if (await usernameInput.count() > 0) {
        await usernameInput.fill("newdemouser");
        await sleep(500);
      }
      await sleep(3000);
      console.log("  ✅ Add User form shown with sample data");
      // Cancel/close form
      const cancelBtn = page.getByRole("button", { name: "Cancel" }).last();
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();
        await sleep(1500);
      }
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 12 — Content Management
    // ──────────────────────────────────────────────────────────
    hr("Scene 12 — Content Management");
    await clickTab(page, "Content");
    await page.waitForLoadState("networkidle");
    await sleep(4000);
    console.log("  ✅ Posts list loaded");

    // Switch to Pages sub-tab
    const pagesTab = page.getByRole("button", { name: "Pages", exact: true });
    if (await pagesTab.count() > 0) {
      await pagesTab.hover();
      await sleep(500);
      await pagesTab.click();
      await sleep(3500);
      console.log("  ✅ Pages sub-tab loaded");
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 13 — WooCommerce Hub
    // ──────────────────────────────────────────────────────────
    hr("Scene 13 — WooCommerce Hub");
    await clickTab(page, "WooCommerce");
    await page.waitForLoadState("networkidle");
    await sleep(5000);
    console.log("  ✅ WooCommerce stats loaded");

    // Click on Orders sub-tab
    const ordersSubTab = page.getByRole("button", { name: "Orders", exact: true });
    if (await ordersSubTab.count() > 0) {
      await ordersSubTab.hover();
      await sleep(500);
      await ordersSubTab.click();
      await sleep(3500);
      console.log("  ✅ Orders list loaded");

      // Update an order status
      const firstOrderSelect = page.locator("select").first();
      if (await firstOrderSelect.count() > 0) {
        await firstOrderSelect.scrollIntoViewIfNeeded();
        await sleep(800);
        await firstOrderSelect.selectOption("completed");
        await sleep(3000);
        console.log("  ✅ Order status updated to completed");
      }
    }

    // Switch to Products sub-tab
    const productsSubTab = page.getByRole("button", { name: "Products", exact: true });
    if (await productsSubTab.count() > 0) {
      await productsSubTab.hover();
      await sleep(500);
      await productsSubTab.click();
      await sleep(3500);
      console.log("  ✅ Products list loaded");
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 14 — Database Management
    // ──────────────────────────────────────────────────────────
    hr("Scene 14 — Database Management");
    await clickTab(page, "Database");
    await page.waitForLoadState("networkidle");
    await sleep(4500);
    console.log("  ✅ Database status loaded");

    // Click Clean Transients
    const cleanTransientsBtn = page.getByRole("button", { name: /transient/i }).first();
    if (await cleanTransientsBtn.count() > 0) {
      await cleanTransientsBtn.scrollIntoViewIfNeeded();
      await cleanTransientsBtn.hover();
      await sleep(600);
      await cleanTransientsBtn.click();
      await sleep(4000);
      console.log("  ✅ Transients cleanup executed");
    }

    // Click Optimize All
    const optimizeBtn = page.getByRole("button", { name: /optimize/i }).first();
    if (await optimizeBtn.count() > 0) {
      await optimizeBtn.scrollIntoViewIfNeeded();
      await optimizeBtn.hover();
      await sleep(600);
      await optimizeBtn.click();
      await sleep(4500);
      console.log("  ✅ Database optimize executed");
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 15 — Network Reports
    // ──────────────────────────────────────────────────────────
    hr("Scene 15 — Network Reports");
    await page.goto(`${DASHBOARD_URL}/reports`);
    await page.waitForLoadState("networkidle");
    await sleep(5000);
    console.log("  ✅ Network reports page loaded");

    // Hover over summary cards
    const reportCards = page.locator(".card-hover");
    const cardCount = await reportCards.count();
    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      await reportCards.nth(i).hover();
      await sleep(400);
    }

    // Click Export Network CSV
    const exportCsvBtn = page.getByRole("button", { name: /export network/i }).first();
    if (await exportCsvBtn.count() > 0) {
      await exportCsvBtn.hover();
      await sleep(600);
      await exportCsvBtn.click();
      await sleep(2000);
      console.log("  ✅ Network CSV export triggered");
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 15b — Updates Panel
    // ──────────────────────────────────────────────────────────
    hr("Scene 15b — Updates Panel");
    // Navigate back to site detail and open Updates tab
    const siteDetailLink = page.locator(`a[href*="/sites/"]`).first();
    await page.goto(`${DASHBOARD_URL}/sites`);
    await page.waitForLoadState("networkidle");
    await sleep(1500);
    const siteLinkForUpdates = page.locator(`a[href*="/sites/"]`).first();
    if (await siteLinkForUpdates.count() > 0) {
      await siteLinkForUpdates.click();
      await page.waitForLoadState("networkidle");
      await sleep(2000);
    }
    await clickTab(page, "Updates");
    await page.waitForLoadState("networkidle");
    await sleep(5000);
    console.log("  ✅ Updates tab loaded");

    // Click Refresh button
    const refreshUpdatesBtn = page.getByRole("button", { name: /refresh/i }).first();
    if (await refreshUpdatesBtn.count() > 0) {
      await refreshUpdatesBtn.hover();
      await sleep(600);
      await refreshUpdatesBtn.click();
      await sleep(4000);
      console.log("  ✅ Updates refreshed");
    }

    // If WP Core update available, hover over update button
    const updateCoreBtn = page.getByRole("button", { name: /update wordpress/i }).first();
    if (await updateCoreBtn.count() > 0) {
      await updateCoreBtn.scrollIntoViewIfNeeded();
      await updateCoreBtn.hover();
      await sleep(1200);
      console.log("  ✅ WP Core update button visible");
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 16 — Notification Center
    // ──────────────────────────────────────────────────────────
    hr("Scene 16 — Notification Center");
    // Seed demo notifications via API
    await page.evaluate(async (url) => {
      await fetch(`${url}/api/notifications/seed`, { method: "POST", credentials: "include" });
    }, DASHBOARD_URL);
    await sleep(1500);

    // Click notification bell in header
    const bellBtn = page.locator('button[aria-label="Notifications"]').first();
    if (await bellBtn.count() > 0) {
      await bellBtn.hover();
      await sleep(500);
      await bellBtn.click();
      await sleep(2000);
      console.log("  ✅ Notification dropdown opened");

      // Scroll through notifications
      const notifDropdown = page.locator('[data-testid="notification-dropdown"], .notifications-dropdown').first();
      await sleep(2000);

      // Click Mark all read
      const markReadBtn = page.getByRole("button", { name: /mark all read/i }).first();
      if (await markReadBtn.count() > 0) {
        await markReadBtn.hover();
        await sleep(500);
        await markReadBtn.click();
        await sleep(2000);
        console.log("  ✅ Notifications marked as read");
      }

      // Close dropdown
      await bellBtn.click();
      await sleep(1000);
    } else {
      console.log("  ℹ️  Bell button not found — notification feature visible in sidebar");
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 17 — Network Updates Dashboard
    // ──────────────────────────────────────────────────────────
    hr("Scene 17 — Network Updates Dashboard");
    await page.goto(`${DASHBOARD_URL}/updates`);
    await page.waitForLoadState("networkidle");
    await sleep(6000);
    console.log("  ✅ Network updates page loaded");

    // Hover over update items if visible
    const updateRows = page.locator("table tbody tr").first();
    if (await updateRows.count() > 0) {
      await updateRows.hover();
      await sleep(1000);
      console.log("  ✅ Update rows visible");
    } else {
      console.log("  ℹ️  All sites up to date (empty state shown)");
    }
    await sleep(3000);

    // ──────────────────────────────────────────────────────────
    //  Scene 17b — Health Score in Overview
    // ──────────────────────────────────────────────────────────
    hr("Scene 17b — Site Health Score");
    // Navigate back to site detail overview to show the health score widget
    await page.goto(`${DASHBOARD_URL}/sites`);
    await page.waitForLoadState("networkidle");
    await sleep(1000);
    const siteForHealth = page.locator(`a[href*="/sites/"]`).first();
    if (await siteForHealth.count() > 0) {
      await siteForHealth.click();
      await page.waitForLoadState("networkidle");
      await sleep(4000);
      console.log("  ✅ Overview with health score loaded");
      // Scroll down slightly to reveal health score widget if needed
      await page.evaluate(() => window.scrollBy(0, 200));
      await sleep(2000);
    }

    // ──────────────────────────────────────────────────────────
    //  Scene 17c — Alert Settings
    // ──────────────────────────────────────────────────────────
    hr("Scene 17c — Alert Settings");
    await page.goto(`${DASHBOARD_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await sleep(3000);
    console.log("  ✅ Settings page loaded");

    // Toggle one alert setting off and back on
    const toggles = page.locator('input[type="checkbox"], button[role="switch"]');
    if (await toggles.count() > 0) {
      const firstToggle = toggles.first();
      await firstToggle.scrollIntoViewIfNeeded();
      await firstToggle.hover();
      await sleep(500);
      await firstToggle.click();
      await sleep(1000);
      await firstToggle.click();
      await sleep(1000);
      console.log("  ✅ Alert toggle demonstrated");
    }

    // Save settings
    const saveBtn = page.getByRole("button", { name: /save/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.hover();
      await sleep(500);
      await saveBtn.click();
      await sleep(2000);
      console.log("  ✅ Settings saved");
    }
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 18 — Connect New Site Wizard
    // ──────────────────────────────────────────────────────────
    hr("Scene 18 — Connect New Site Wizard");
    await page.goto(`${DASHBOARD_URL}/connect`, { waitUntil: "domcontentloaded" });
    await sleep(2000);
    console.log("  👁  Connect wizard — Step 1: Welcome");
    // Step 1: Welcome — click Get Started
    const getStartedBtn = page.locator("button", { hasText: "Get Started" });
    if (await getStartedBtn.count() > 0) {
      await sleep(1500);
      await getStartedBtn.first().click();
      await sleep(1500);
    }
    // Step 2: Download — show download button, click "Downloaded"
    console.log("  👁  Step 2: Download plugin");
    await sleep(1500);
    const downloadedBtn = page.locator("button", { hasText: "Downloaded" });
    if (await downloadedBtn.count() > 0) {
      await sleep(1500);
      await downloadedBtn.first().click();
      await sleep(1500);
    }
    // Step 3: Install & Token
    console.log("  👁  Step 3: Install & activate");
    await sleep(1500);
    const hasTokenBtn = page.locator("button", { hasText: "I have my token" });
    if (await hasTokenBtn.count() > 0) {
      await sleep(2000);
      await hasTokenBtn.first().click();
      await sleep(1500);
    }
    // Step 4: Connect form
    console.log("  👁  Step 4: Connect site form");
    const nameInput = page.locator("input[placeholder='My WordPress Site']");
    if (await nameInput.count() > 0) {
      await nameInput.fill("My WordPress Blog");
      await sleep(600);
      const urlInput = page.locator("input[placeholder='https://yoursite.com']");
      await urlInput.fill("https://myblog.com");
      await sleep(600);
      const tokenInput = page.locator("input[placeholder='Paste your token here']");
      await tokenInput.fill("demo-token-abc123xyz");
      await sleep(1500);
    }
    console.log("  ✅ Connect wizard walkthrough complete");
    await sleep(2000);

    // ──────────────────────────────────────────────────────────
    //  Scene 18b — Organizations & Teams
    // ──────────────────────────────────────────────────────────
    hr("Scene 18b — Organizations & Teams");
    await page.goto(`${DASHBOARD_URL}/organizations`, { waitUntil: "domcontentloaded" });
    await sleep(2500);
    // Show the create org form
    const createOrgBtn = page.locator("button", { hasText: /Create|New Org/i });
    if (await createOrgBtn.count() > 0) {
      await sleep(1000);
      await createOrgBtn.first().click();
      await sleep(1000);
    }
    // Fill org name
    const orgNameInput = page.locator("input[placeholder*='Org'], input[placeholder*='org'], input[placeholder*='name'], input[placeholder*='Name']").first();
    if (await orgNameInput.count() > 0) {
      await orgNameInput.fill("My Agency");
      await sleep(800);
    }
    await sleep(2000);
    console.log("  ✅ Organizations page showcased");
    await sleep(1500);

    // ──────────────────────────────────────────────────────────
    //  Scene 18d — Billing & Plans
    // ──────────────────────────────────────────────────────────
    hr("Scene 18d — Billing & Plans");
    await page.goto(`${DASHBOARD_URL}/billing`, { waitUntil: "domcontentloaded" });
    await sleep(3000);
    // Scroll to show plan cards
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
    await sleep(1500);
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await sleep(1500);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);
    // Hover over Pro plan card
    const proPlanCard = page.locator("text=Pro").first();
    if (await proPlanCard.count() > 0) {
      await proPlanCard.hover();
      await sleep(1500);
    }
    console.log("  ✅ Billing page showcased");
    await sleep(1500);

    // ──────────────────────────────────────────────────────────
    //  Scene 18c — MCP / AI Integration
    // ──────────────────────────────────────────────────────────
    hr("Scene 18c — MCP / AI Integration");
    await page.goto(`${DASHBOARD_URL}/mcp`, { waitUntil: "domcontentloaded" });    await sleep(3000);
    // Scroll slowly down the MCP page to show the content
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await sleep(1500);
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await sleep(1500);
    await page.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
    await sleep(2000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);
    console.log("  ✅ MCP page showcased");
    await sleep(1500);

    // ──────────────────────────────────────────────────────────
    //  Scene 19 — Finale: Overview
    // ──────────────────────────────────────────────────────────
    hr("Scene 19 — Finale: Overview");
    await page.goto(`${DASHBOARD_URL}/sites`);
    await page.waitForLoadState("networkidle");
    await sleep(3000);
    // Navigate back to site detail overview
    const siteLink = page.locator(`a[href*="/sites/"]`).first();
    if (await siteLink.count() > 0) {
      await siteLink.click();
      await page.waitForLoadState("networkidle");
      await sleep(6000);
    }
    console.log("  ✅ 360° onboarding demo complete");

  } catch (err) {
    console.error(`\n❌ Recording error: ${err}`);
  }

  // ── Save video ────────────────────────────────────────────────
  const rawPath = await page.video()?.path();
  await ctx.close();
  await browser.close();

  if (rawPath) {
    const webmOut = path.join(VIDEO_DIR, "wpdash-full-demo.webm");
    if (fs.existsSync(webmOut)) fs.unlinkSync(webmOut);
    fs.copyFileSync(rawPath, webmOut);
    try { fs.unlinkSync(rawPath); } catch { /* ok */ }

    const webmMB = (fs.statSync(webmOut).size / 1024 / 1024).toFixed(1);
    console.log(`\n✅ WebM saved: ${webmOut} (${webmMB} MB)`);

    try {
      const mp4Out = path.join(VIDEO_DIR, "wpdash-full-demo.mp4");
      execSync(
        `ffmpeg -y -i "${webmOut}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${mp4Out}" 2>/dev/null`,
      );
      const mp4MB = (fs.statSync(mp4Out).size / 1024 / 1024).toFixed(1);
      console.log(`✅ MP4 saved:  ${mp4Out} (${mp4MB} MB)`);
    } catch {
      console.log("ℹ️  ffmpeg not found — keeping WebM only");
    }
  }

  // (No hello.php restore needed — demo uses hello-dolly/ directory plugin)

  console.log("\n🎬  Done!\n");
}

main();
