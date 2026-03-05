"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { userPlans } from "@/infrastructure/database/schemas/user-plans";
import { eq } from "drizzle-orm";
import { resend, FROM_EMAIL } from "@/lib/resend";
import {
  siteOfflineTemplate,
  backupStaleTemplate,
  securityAlertTemplate,
  weeklyReportTemplate,
  type WeeklyReportSite,
} from "@/infrastructure/email/templates";

const isResendConfigured =
  !!process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_placeholder");

async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

async function getUserAlertPreferences(userId: string) {
  const rows = await db.select().from(userPlans).where(eq(userPlans.userId, userId));
  // Alerts enabled for all non-free plans; free plan also gets alerts
  return { alertsEnabled: rows.length > 0 || true };
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isResendConfigured) {
    // eslint-disable-next-line no-console
    console.log(`[email] Would send "${subject}" to ${to} (Resend not configured)`);
    return;
  }

  const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[email] Failed to send:", error);
  }
}

interface SiteRef {
  name: string;
  url: string;
}

export async function sendSiteOfflineAlert(userId: string, site: SiteRef): Promise<void> {
  const prefs = await getUserAlertPreferences(userId);
  if (!prefs.alertsEnabled) return;

  const email = await getUserEmail(userId);
  if (!email) return;

  const html = siteOfflineTemplate({
    siteName: site.name,
    siteUrl: site.url,
    detectedAt: new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC",
  });

  await sendEmail(email, `🔴 ${site.name} is offline`, html);
}

export async function sendBackupStaleAlert(
  userId: string,
  site: SiteRef,
  daysSince: number,
): Promise<void> {
  const prefs = await getUserAlertPreferences(userId);
  if (!prefs.alertsEnabled) return;

  const email = await getUserEmail(userId);
  if (!email) return;

  const lastBackupDate = new Date();
  lastBackupDate.setDate(lastBackupDate.getDate() - daysSince);

  const html = backupStaleTemplate({
    siteName: site.name,
    lastBackup: lastBackupDate.toLocaleDateString("en-US"),
    daysSince,
  });

  await sendEmail(email, `⚠️ Backup overdue for ${site.name}`, html);
}

export async function sendSecurityAlert(
  userId: string,
  site: SiteRef,
  findings: string[],
): Promise<void> {
  const prefs = await getUserAlertPreferences(userId);
  if (!prefs.alertsEnabled) return;

  const email = await getUserEmail(userId);
  if (!email) return;

  const html = securityAlertTemplate({ siteName: site.name, findings });

  await sendEmail(email, `🔒 Security alert for ${site.name}`, html);
}

export async function sendWeeklyReport(userId: string, sites: WeeklyReportSite[]): Promise<void> {
  const prefs = await getUserAlertPreferences(userId);
  if (!prefs.alertsEnabled) return;

  const email = await getUserEmail(userId);
  if (!email) return;

  const reportDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = weeklyReportTemplate({ sites, reportDate });

  await sendEmail(email, `📊 Your WP Dash weekly report — ${reportDate}`, html);
}
