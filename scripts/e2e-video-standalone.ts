#!/usr/bin/env npx tsx
/**
 * WP Dash Standalone — Full 360° Demo Video
 *
 * Records a polished Playwright onboarding demo of the wp-dash-standalone
 * plugin: add remote site → manage plugins (activate/deactivate/install/delete)
 * → overview → security → SEO → logs → backup → WooCommerce.
 *
 * Usage:
 *   npx tsx scripts/e2e-video-standalone.ts
 */

import { chromium, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// ── Config ────────────────────────────────────────────────────────────────
const WP_ADMIN_URL = "http://localhost:8080/wp-admin";
const WP_USER = "admin";
const WP_PASS = "admin123";
const OUTPUT_PATH = path.resolve(__dirname, "../wp-dash-standalone-demo.mp4");

// ── Helpers ───────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function hr(label: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${label}`);
  console.log("─".repeat(60));
}

// ── Main ──────────────────────────────────────────────────────────────────
(async () => {
  // Cleanup old video artefacts
  for (const f of fs.readdirSync(path.dirname(path.resolve(__dirname, "../wp-dash-standalone-demo.webm"))).filter(x => x.endsWith(".webm"))) {
    fs.unlinkSync(path.join(path.dirname(path.resolve(__dirname, "../wp-dash-standalone-demo.webm")), f));
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: path.resolve(__dirname, "../"),
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  try {
    // ──────────────────────────────────────────────────────────
    //  Scene 1 — WordPress Admin Login
    // ──────────────────────────────────────────────────────────
    hr("Scene 1 — WP Admin Login");
    await page.goto("http://localhost:8080/wp-login.php");
    await page.waitForLoadState("networkidle");
    await sleep(1200);

    await page.fill("#user_login", WP_USER);
    await sleep(500);
    await page.fill("#user_pass", WP_PASS);
    await sleep(500);
    await page.click("#wp-submit");
    await page.waitForLoadState("networkidle");
    await sleep(1500);
    console.log("  ✅ Logged in to WordPress Admin");

    // ──────────────────────────────────────────────────────────
    //  Scene 2 — Settings: First launch (no sites)
    // ──────────────────────────────────────────────────────────
    hr("Scene 2 — Settings: Add Remote Site");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-settings`);
    await page.waitForLoadState("networkidle");
    await sleep(2000);
    console.log("  ✅ Settings page loaded (no sites yet)");

    // Fill in the add-site form
    await page.locator("#wpdash-site-name").click();
    await page.keyboard.type("My WordPress Site", { delay: 60 });
    await sleep(400);
    await page.locator("#wpdash-site-url").click();
    await page.keyboard.type("http://localhost", { delay: 60 });
    await sleep(400);
    await page.locator("#wpdash-site-token").click();
    await page.keyboard.type("c0ad5f3f1e0b3e4a5f6c7d8e9f0a1b2c", { delay: 40 });
    await sleep(600);

    // Test Connection
    await page.locator("#wpdash-test-connection").click();
    // Wait for the result text to appear (non-empty)
    await page.waitForFunction(
      () => (document.querySelector("#wpdash-test-result") as HTMLElement)?.textContent?.trim().length ?? 0 > 0,
      { timeout: 12000 }
    );
    await sleep(2000);
    console.log("  ✅ Connection tested");

    // Add the site
    await page.locator("#wpdash-add-site-btn").click();
    // Wait for page reload (site added triggers location.reload())
    await page.waitForLoadState("networkidle");
    await sleep(2000);
    console.log("  ✅ Site added");

    // ──────────────────────────────────────────────────────────
    //  Scene 3 — Dashboard Overview (bridge data)
    // ──────────────────────────────────────────────────────────
    hr("Scene 3 — Dashboard Overview");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa`);
    await page.waitForLoadState("networkidle");
    await sleep(2000);
    // Scroll through the health metrics
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
    await sleep(1200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);
    console.log("  ✅ Overview loaded with remote site data");

    // ──────────────────────────────────────────────────────────
    //  Scene 4 — Plugins: Update
    // ──────────────────────────────────────────────────────────
    hr("Scene 4 — Plugins: Update WooCommerce");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-plugins`);
    await page.waitForLoadState("networkidle");
    await sleep(1800);
    console.log("  ✅ Plugins list loaded");

    // Scroll down slowly to show all plugins
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: "smooth" }));
    await sleep(1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(800);

    // Update WooCommerce if update is available
    const updateBtn = page.locator("button.wpdash-plugin-action[data-action='update']").first();
    if (await updateBtn.count() > 0) {
      await updateBtn.scrollIntoViewIfNeeded();
      await sleep(500);
      await updateBtn.hover();
      await sleep(700);
      await updateBtn.click();
      await sleep(500);
      try {
        await page.locator("#wpdash-sa-notice").waitFor({ timeout: 15000 });
      } catch { /* may reload */ }
      await sleep(3000);
      console.log("  ✅ Plugin update triggered");
    } else {
      console.log("  ℹ️  No update buttons (all up to date)");
    }

    // ──────────────────────────────────────────────────────────
    //  Scene 5 — Plugins: Activate & Deactivate
    // ──────────────────────────────────────────────────────────
    hr("Scene 5 — Plugins: Activate & Deactivate");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-plugins`);
    await page.waitForLoadState("networkidle");
    // Wait for plugin table to render (bridge call may take a few seconds)
    try {
      await page.locator("#wpdash-plugins-table").waitFor({ timeout: 20000 });
    } catch { console.log("  ⚠️  Plugins table did not appear — bridge may be slow"); }
    await sleep(1500);

    // Search for hello-dolly
    const searchBox = page.locator("#wpdash-plugin-search");
    if (await searchBox.count() > 0) {
      await searchBox.click();
      await page.keyboard.type("hello", { delay: 80 });
      await sleep(1000);
    }

    // Activate Hello Dolly (visible row only)
    const activateBtn = page.locator("tr:visible button.wpdash-plugin-action[data-action='activate']").first();
    if (await activateBtn.count() > 0) {
      await activateBtn.hover();
      await sleep(600);
      await activateBtn.click();
      try { await page.locator("tr:visible .wpdash-sa-badge--active").first().waitFor({ timeout: 8000 }); } catch {}
      await sleep(2000);
      console.log("  ✅ Hello Dolly activated");
    } else {
      console.log("  ℹ️  No visible activate button");
    }

    // Deactivate it
    const deactivateBtn = page.locator("tr:visible button.wpdash-plugin-action[data-action='deactivate']").first();
    if (await deactivateBtn.count() > 0) {
      await deactivateBtn.hover();
      await sleep(600);
      await deactivateBtn.click();
      try { await page.locator("tr:visible .wpdash-sa-badge--inactive").first().waitFor({ timeout: 8000 }); } catch {}
      await sleep(2000);
      console.log("  ✅ Hello Dolly deactivated");
    } else {
      console.log("  ℹ️  No visible deactivate button");
    }

    // Clear search
    if (await searchBox.count() > 0) {
      await searchBox.fill("");
      await sleep(800);
    }

    // ──────────────────────────────────────────────────────────
    //  Scene 6 — Plugins: Install New Plugin
    // ──────────────────────────────────────────────────────────
    hr("Scene 6 — Plugins: Install from WordPress.org");
    // Scroll to install section
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
    await sleep(1200);

    const slugInput = page.locator("#wpdash-install-slug");
    if (await slugInput.count() > 0) {
      await slugInput.click();
      await page.keyboard.type("limit-login-attempts-reloaded", { delay: 60 });
      await sleep(600);
      const installBtn = page.locator("#wpdash-install-plugin-btn");
      await installBtn.hover();
      await sleep(500);
      await installBtn.click();
      await sleep(500);
      // Wait for success notice
      try {
        await page.locator("#wpdash-sa-notice").waitFor({ timeout: 30000 });
        await sleep(2000);
      } catch { await sleep(5000); }
      console.log("  ✅ Plugin install triggered");
    }

    // ──────────────────────────────────────────────────────────
    //  Scene 7 — Plugins: Delete Plugin
    // ──────────────────────────────────────────────────────────
    hr("Scene 7 — Plugins: Delete contact-form-7");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-plugins`);
    await page.waitForLoadState("networkidle");
    try { await page.locator("#wpdash-plugins-table").waitFor({ timeout: 20000 }); } catch {}
    await sleep(1500);

    // Search for contact-form-7
    const searchBox7 = page.locator("#wpdash-plugin-search");
    if (await searchBox7.count() > 0) {
      await searchBox7.click();
      await page.keyboard.type("contact", { delay: 80 });
      await sleep(1000);
    }

    const deleteBtn = page.locator("tr:visible button.wpdash-plugin-delete").first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.hover();
      await sleep(700);
      // Handle confirm dialog
      page.once("dialog", async dialog => { await dialog.accept(); });
      await deleteBtn.click();
      try { await page.locator("#wpdash-sa-notice").waitFor({ timeout: 10000 }); } catch {}
      await sleep(2500);
      console.log("  ✅ contact-form-7 deleted");
    } else {
      console.log("  ℹ️  Delete button not visible");
    }

    if (await searchBox7.count() > 0) {
      await searchBox7.fill("");
    }
    await sleep(600);

    // ──────────────────────────────────────────────────────────
    //  Scene 8 — Security Audit
    // ──────────────────────────────────────────────────────────
    hr("Scene 8 — Security Audit");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-security`);
    await page.waitForLoadState("networkidle");
    await sleep(1500);

    const runAuditBtn = page.locator("button#wpdash-run-security-check").or(
      page.locator("button:has-text('Security Check')").first()
    );
    if (await runAuditBtn.count() > 0) {
      await runAuditBtn.scrollIntoViewIfNeeded();
      await runAuditBtn.hover();
      await sleep(600);
      await runAuditBtn.click();
      try {
        await page.locator(".wpdash-security-results, #wpdash-security-results, .wpdash-sa-card").waitFor({ timeout: 15000 });
      } catch {}
      await sleep(3000);
    }
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: "smooth" }));
    await sleep(1200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);
    console.log("  ✅ Security audit loaded");

    // ──────────────────────────────────────────────────────────
    //  Scene 9 — SEO Audit
    // ──────────────────────────────────────────────────────────
    hr("Scene 9 — SEO Audit");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-seo`);
    await page.waitForLoadState("networkidle");
    await sleep(1500);

    const runSeoBtn = page.locator("button#wpdash-run-seo").or(
      page.locator("button:has-text('Run SEO Audit')").first()
    );
    if (await runSeoBtn.count() > 0) {
      await runSeoBtn.scrollIntoViewIfNeeded();
      await runSeoBtn.hover();
      await sleep(600);
      await runSeoBtn.click();
      try {
        await page.locator(".wpdash-seo-results, #wpdash-seo-results, .wpdash-sa-card").waitFor({ timeout: 15000 });
      } catch {}
      await sleep(3000);
    }
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
    await sleep(1200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);
    console.log("  ✅ SEO audit loaded");

    // ──────────────────────────────────────────────────────────
    //  Scene 10 — Activity Logs
    // ──────────────────────────────────────────────────────────
    hr("Scene 10 — Activity Logs");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-logs`);
    await page.waitForLoadState("networkidle");
    await sleep(2000);
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: "smooth" }));
    await sleep(1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);
    console.log("  ✅ Logs loaded");

    // ──────────────────────────────────────────────────────────
    //  Scene 11 — Backup Status
    // ──────────────────────────────────────────────────────────
    hr("Scene 11 — Backup Status");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-backup`);
    await page.waitForLoadState("networkidle");
    await sleep(2000);
    await page.evaluate(() => window.scrollTo({ top: 150, behavior: "smooth" }));
    await sleep(1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);
    console.log("  ✅ Backup status loaded");

    // ──────────────────────────────────────────────────────────
    //  Scene 12 — WooCommerce Hub
    // ──────────────────────────────────────────────────────────
    hr("Scene 12 — WooCommerce Hub");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa-woocommerce`);
    await page.waitForLoadState("networkidle");
    await sleep(2000);
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
    await sleep(1200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(2000);
    console.log("  ✅ WooCommerce hub loaded");

    // ──────────────────────────────────────────────────────────
    //  Scene 13 — Back to Overview (final shot)
    // ──────────────────────────────────────────────────────────
    hr("Scene 13 — Final: Overview");
    await page.goto(`${WP_ADMIN_URL}/admin.php?page=wp-dash-sa`);
    await page.waitForLoadState("networkidle");
    await sleep(2000);
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
    await sleep(1200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(2500);
    console.log("  ✅ Final shot complete");

    console.log("\n✅ All scenes complete!");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();

    // Rename the video file
    const videoDir = path.resolve(__dirname, "../");
    const videoFiles = fs.readdirSync(videoDir).filter(f => f.endsWith(".webm"));
    if (videoFiles.length > 0) {
      const latest = videoFiles
        .map(f => ({ f, mtime: fs.statSync(path.join(videoDir, f)).mtime }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0].f;
      const src = path.join(videoDir, latest);
      const dest = path.join(videoDir, "wp-dash-standalone-demo.webm");
      fs.renameSync(src, dest);
      console.log(`\n📹 Video saved: ${dest}`);
    }
  }
})();
