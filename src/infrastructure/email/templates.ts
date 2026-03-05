export interface SiteOfflineTemplateParams {
  siteName: string;
  siteUrl: string;
  detectedAt: string;
}

export interface BackupStaleTemplateParams {
  siteName: string;
  lastBackup: string;
  daysSince: number;
}

export interface SecurityAlertTemplateParams {
  siteName: string;
  findings: string[];
}

export interface WeeklyReportSite {
  name: string;
  url: string;
  status: "online" | "offline" | "degraded";
}

export interface WeeklyReportTemplateParams {
  sites: WeeklyReportSite[];
  reportDate: string;
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
`;

const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.wpdash.app";

export function siteOfflineTemplate({ siteName, siteUrl, detectedAt }: SiteOfflineTemplateParams): string {
  return `
    <div style="${baseStyle}">
      <div style="background: #ef4444; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔴 Site Offline Alert</h1>
      </div>
      <div style="padding: 32px; background: #fef2f2; border: 1px solid #fecaca;">
        <h2 style="color: #dc2626; margin-top: 0;">${siteName} is offline</h2>
        <p style="color: #374151; margin: 8px 0;"><strong>URL:</strong> ${siteUrl}</p>
        <p style="color: #374151; margin: 8px 0;"><strong>Detected at:</strong> ${detectedAt}</p>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${dashboardUrl}" style="background: #ef4444; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Check Dashboard
          </a>
        </div>
      </div>
      <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
        WP Dash — WordPress Monitoring
      </div>
    </div>
  `;
}

export function backupStaleTemplate({ siteName, lastBackup, daysSince }: BackupStaleTemplateParams): string {
  return `
    <div style="${baseStyle}">
      <div style="background: #f59e0b; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Backup Warning</h1>
      </div>
      <div style="padding: 32px; background: #fffbeb; border: 1px solid #fde68a;">
        <h2 style="color: #d97706; margin-top: 0;">Backup Overdue for ${siteName}</h2>
        <p style="color: #374151; margin: 8px 0;"><strong>Last backup:</strong> ${lastBackup}</p>
        <p style="color: #374151; margin: 8px 0;"><strong>Days since last backup:</strong> ${daysSince}</p>
        <p style="color: #6b7280; margin-top: 16px;">We recommend backing up your site at least every 7 days.</p>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${dashboardUrl}" style="background: #f59e0b; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            View Site
          </a>
        </div>
      </div>
      <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
        WP Dash — WordPress Monitoring
      </div>
    </div>
  `;
}

export function securityAlertTemplate({ siteName, findings }: SecurityAlertTemplateParams): string {
  const findingsList = findings
    .map((f) => `<li style="color: #374151; margin: 4px 0;">${f}</li>`)
    .join("");

  return `
    <div style="${baseStyle}">
      <div style="background: #7c3aed; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔒 Security Alert</h1>
      </div>
      <div style="padding: 32px; background: #f5f3ff; border: 1px solid #ddd6fe;">
        <h2 style="color: #7c3aed; margin-top: 0;">Security issues detected on ${siteName}</h2>
        <p style="color: #374151; margin-bottom: 12px;"><strong>Findings:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          ${findingsList}
        </ul>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${dashboardUrl}" style="background: #7c3aed; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Review Security Report
          </a>
        </div>
      </div>
      <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
        WP Dash — WordPress Monitoring
      </div>
    </div>
  `;
}

export function weeklyReportTemplate({ sites, reportDate }: WeeklyReportTemplateParams): string {
  const statusColor = (status: WeeklyReportSite["status"]) => {
    if (status === "online") return "#22c55e";
    if (status === "offline") return "#ef4444";
    return "#f59e0b";
  };

  const statusLabel = (status: WeeklyReportSite["status"]) => {
    if (status === "online") return "✅ Online";
    if (status === "offline") return "🔴 Offline";
    return "⚠️ Degraded";
  };

  const rows = sites
    .map(
      (s) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${s.name}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">${s.url}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: ${statusColor(s.status)}; font-weight: 600;">${statusLabel(s.status)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="${baseStyle}">
      <div style="background: #3b82f6; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 Weekly Report</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0;">${reportDate}</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #111827; margin-top: 0;">Your Sites Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 10px 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Site</th>
              <th style="padding: 10px 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">URL</th>
              <th style="padding: 10px 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${dashboardUrl}" style="background: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Open Dashboard
          </a>
        </div>
      </div>
      <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
        WP Dash — WordPress Monitoring
      </div>
    </div>
  `;
}
