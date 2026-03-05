import { relations } from "drizzle-orm";

export { sites } from "./sites";
export { uptimeChecks } from "./uptime-checks";
export { securityAudits } from "./security-audits";
export { sitePlugins } from "./site-plugins";
export { seoAudits } from "./seo-audits";
export { siteLogs } from "./site-logs";
export { backupRecords } from "./backup-records";
export { notifications } from "./notifications";

import { sites } from "./sites";
import { uptimeChecks } from "./uptime-checks";
import { securityAudits } from "./security-audits";
import { sitePlugins } from "./site-plugins";
import { seoAudits } from "./seo-audits";
import { siteLogs } from "./site-logs";
import { backupRecords } from "./backup-records";

export const sitesRelations = relations(sites, ({ many }) => ({
  uptimeChecks: many(uptimeChecks),
  securityAudits: many(securityAudits),
  sitePlugins: many(sitePlugins),
  seoAudits: many(seoAudits),
  siteLogs: many(siteLogs),
  backupRecords: many(backupRecords),
}));

export const uptimeChecksRelations = relations(uptimeChecks, ({ one }) => ({
  site: one(sites, { fields: [uptimeChecks.siteId], references: [sites.id] }),
}));

export const securityAuditsRelations = relations(securityAudits, ({ one }) => ({
  site: one(sites, { fields: [securityAudits.siteId], references: [sites.id] }),
}));

export const sitePluginsRelations = relations(sitePlugins, ({ one }) => ({
  site: one(sites, { fields: [sitePlugins.siteId], references: [sites.id] }),
}));

export const seoAuditsRelations = relations(seoAudits, ({ one }) => ({
  site: one(sites, { fields: [seoAudits.siteId], references: [sites.id] }),
}));

export const siteLogsRelations = relations(siteLogs, ({ one }) => ({
  site: one(sites, { fields: [siteLogs.siteId], references: [sites.id] }),
}));

export const backupRecordsRelations = relations(backupRecords, ({ one }) => ({
  site: one(sites, { fields: [backupRecords.siteId], references: [sites.id] }),
}));
