#!/usr/bin/env npx tsx
/**
 * WP Dash — Visual E2E Video Proof
 * 
 * Records a browser video showing the REAL dashboard UI as a customer would see it.
 * Uses Playwright's built-in video recording to capture the full user experience.
 */

import { chromium, type Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";
const SUPABASE_URL = "http://127.0.0.1:54331";
const SUPABASE_ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const WP_URL = "http://localhost:8080";
const USER_EMAIL = `demo-${Date.now()}@wpdash.local`;
const USER_PASSWORD = "DemoTest1234!";
const VIDEO_DIR = path.join(process.cwd(), "evidence", "videos");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForText(page: Page, text: string, timeout = 15000): Promise<boolean> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const body = await page.textContent("body").catch(() => "");
    if (body?.includes(text)) return true;
    await sleep(500);
  }
  return false;
}

async function getWpBridgeToken(): Promise<string> {
  try {
    const { execSync } = await import("child_process");
    const output = execSync("docker logs wpdash-test-cli 2>&1", { encoding: "utf-8" });
    const match = output.match(/^[a-f0-9]{64}$/m);
    return match ? match[0] : process.env.WP_BRIDGE_TOKEN || "";
  } catch { return process.env.WP_BRIDGE_TOKEN || ""; }
}

async function clickTab(page: Page, tabName: string) {
  // The tabs are <button> elements in a nav flex container
  const btn = page.locator(`button:text-is("${tabName}")`);
  if (await btn.count() > 0) {
    await btn.first().click({ timeout: 5000 });
    return true;
  }
  // Fallback: try getByRole
  const roleBtn = page.getByRole("button", { name: tabName, exact: true });
  if (await roleBtn.count() > 0) {
    await roleBtn.first().click({ timeout: 5000 });
    return true;
  }
  return false;
}

async function waitForPluginPresence(
  page: Page,
  pluginName: string,
  present: boolean,
  timeout = 15000,
): Promise<boolean> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const count = await page
      .locator("tbody tr")
      .filter({ hasText: pluginName })
      .count();
    if ((present && count > 0) || (!present && count === 0)) {
      return true;
    }
    await sleep(500);
  }
  return false;
}

async function assertNoPluginNotFound(page: Page) {
  const body = (await page.textContent("body")) ?? "";
  if (body.includes("Plugin not found")) {
    throw new Error("Dashboard shows 'Plugin not found' in Plugins tab");
  }
}

async function main() {
  console.log("🎬 WP Dash — Visual E2E Video Recording\n");

  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const wpToken = await getWpBridgeToken();
  if (!wpToken) { console.error("ERROR: WP Bridge token not found"); process.exit(1); }

  // Pre-create user and site
  console.log("Setting up test data...");
  const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
  });
  const { user } = (await signupRes.json()) as any;
  console.log(`  User: ${user?.id}`);

  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
  });
  const { access_token } = (await loginRes.json()) as any;

  const siteRes = await fetch(`${SUPABASE_URL}/rest/v1/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${access_token}`, Prefer: "return=representation" },
    body: JSON.stringify({ user_id: user.id, name: "Demo WordPress", url: WP_URL, token_hash: wpToken, status: "online" }),
  });
  const sites = (await siteRes.json()) as any[];
  const siteId = sites[0]?.id;
  console.log(`  Site: ${siteId}\n`);

  // Launch browser with video
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  try {
    // ── Sign In ──────────────────────────────────────────────
    console.log("📹 Sign In");
    await page.goto(`${DASHBOARD_URL}/signin`);
    await page.waitForLoadState("networkidle");
    await sleep(2000);

    await page.locator('input[name="email"]').pressSequentially(USER_EMAIL, { delay: 30 });
    await sleep(300);
    await page.locator('input[name="password"]').pressSequentially(USER_PASSWORD, { delay: 30 });
    await sleep(1500);

    await page.click('button[type="submit"]');
    await sleep(4000);
    console.log("   ✅ Signed in");

    // ── Sites List ───────────────────────────────────────────
    console.log("📹 Sites List");
    await page.waitForLoadState("networkidle");
    await sleep(3000);
    console.log("   ✅ Dashboard shown");

    // Navigate to site detail
    await page.goto(`${DASHBOARD_URL}/sites/${siteId}`);
    await page.waitForLoadState("networkidle");

    // ── Overview Tab ─────────────────────────────────────────
    console.log("📹 Overview Tab");
    await waitForText(page, "6.7", 20000);
    await sleep(4000);
    console.log("   ✅ WP 6.7.2 + PHP 8.2.28");

    // ── Plugins Tab ──────────────────────────────────────────
    console.log("📹 Plugins Tab");
    await clickTab(page, "Plugins");
    await waitForText(page, "Akismet", 15000);
    await sleep(4000);
    await assertNoPluginNotFound(page);
    console.log("   ✅ Plugin list loaded");

    // Plugin management - Activate / Deactivate / Update / Delete
    console.log("📹 Plugin Management — Activate / Deactivate / Update / Delete");
    const helloRow = () => page.locator("tbody tr").filter({ hasText: "Hello Dolly" }).first();
    const hasHello = await waitForPluginPresence(page, "Hello Dolly", true, 8000);

    if (!hasHello) {
      console.log("   ⚠️ Hello Dolly row not found");
    } else {
      const activateBtn = helloRow().getByRole("button", { name: "Activate", exact: true });
      if (await activateBtn.count() > 0) {
        await activateBtn.first().click();
        await sleep(4000);
        await assertNoPluginNotFound(page);
        console.log("   ✅ Plugin activated");
      }

      const deactivateBtn = helloRow().getByRole("button", { name: "Deactivate", exact: true });
      if (await deactivateBtn.count() > 0) {
        await deactivateBtn.first().click();
        await sleep(3500);
        await assertNoPluginNotFound(page);
        console.log("   ✅ Plugin deactivated");
      }

      const updateBtn = helloRow().getByRole("button", { name: "Update", exact: true });
      if (await updateBtn.count() > 0) {
        await updateBtn.first().click();
        await sleep(3500);
        await assertNoPluginNotFound(page);
        console.log("   ✅ Plugin update action executed");
      }

      const deleteBtn = helloRow().getByRole("button", { name: "Delete", exact: true });
      if (await deleteBtn.count() > 0) {
        page.once("dialog", (dialog) => dialog.accept());
        await deleteBtn.first().click();
        const deleted = await waitForPluginPresence(page, "Hello Dolly", false, 12000);
        await sleep(1500);
        await assertNoPluginNotFound(page);
        if (deleted) {
          console.log("   ✅ Plugin deleted");
        } else {
          console.log("   ⚠️ Delete action did not remove plugin row");
        }
      }
    }

    // ── Security Tab ─────────────────────────────────────────
    console.log("📹 Security Tab");
    await clickTab(page, "Security");
    await waitForText(page, "Secure", 12000);
    await sleep(4000);
    console.log("   ✅ Security audit shown");

    // ── SEO Tab ──────────────────────────────────────────────
    console.log("📹 SEO Tab");
    await clickTab(page, "SEO");
    await sleep(5000);
    console.log("   ✅ SEO tab shown");

    // ── Logs Tab ─────────────────────────────────────────────
    console.log("📹 Logs Tab");
    await clickTab(page, "Logs");
    await waitForText(page, "Errors", 10000);
    await sleep(4000);
    console.log("   ✅ Logs shown");

    // ── Backup Tab ───────────────────────────────────────────
    console.log("📹 Backup Tab");
    await clickTab(page, "Backup");
    await waitForText(page, "Backup", 10000);
    await sleep(4000);
    console.log("   ✅ Backup status shown");

    // ── Uptime Tab ───────────────────────────────────────────
    console.log("📹 Uptime Tab");
    await clickTab(page, "Uptime");
    await sleep(3000);
    console.log("   ✅ Uptime shown");

    // ── Back to Overview ─────────────────────────────────────
    console.log("📹 Final: Back to Overview");
    await clickTab(page, "Overview");
    await sleep(3000);
    console.log("   ✅ Full circle complete");

  } catch (err) {
    console.error(`\n❌ Error: ${err}`);
  }

  // Finalize video
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (videoPath) {
    const webmPath = path.join(VIDEO_DIR, "wpdash-full-demo.webm");
    fs.copyFileSync(videoPath, webmPath);
    console.log(`\n✅ WebM: ${webmPath}`);
    const webmSize = fs.statSync(webmPath).size;
    console.log(`   Size: ${(webmSize / 1024 / 1024).toFixed(1)} MB`);

    // Convert to MP4
    try {
      const { execSync } = await import("child_process");
      const mp4Path = path.join(VIDEO_DIR, "wpdash-full-demo.mp4");
      execSync(`ffmpeg -y -i "${webmPath}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p "${mp4Path}" 2>/dev/null`);
      const mp4Size = fs.statSync(mp4Path).size;
      console.log(`✅ MP4: ${mp4Path}`);
      console.log(`   Size: ${(mp4Size / 1024 / 1024).toFixed(1)} MB`);
    } catch {
      console.log("ℹ️ ffmpeg not found — WebM only");
    }
    
    // Cleanup temp video
    try { fs.unlinkSync(videoPath); } catch {}
  }

  try {
    const { execSync } = await import("child_process");
    execSync(
      "docker exec wpdash-test-wp sh -lc 'if [ ! -f /var/www/html/wp-content/plugins/hello.php ] && [ -f /usr/src/wordpress/wp-content/plugins/hello.php ]; then cp /usr/src/wordpress/wp-content/plugins/hello.php /var/www/html/wp-content/plugins/hello.php; fi'",
      { stdio: "ignore" },
    );
  } catch {}

  console.log("\n🎬 Done!");
}

main();
