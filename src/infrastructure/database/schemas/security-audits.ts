import { pgTable, uuid, timestamp, boolean, integer, varchar, jsonb } from "drizzle-orm/pg-core";

export const securityAudits = pgTable("security_audits", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // clean | warning | critical
  coreIntegrityPassed: boolean("core_integrity_passed").notNull(),
  suspiciousFilesCount: integer("suspicious_files_count").default(0).notNull(),
  findings: jsonb("findings"), // detailed findings array
  auditedAt: timestamp("audited_at", { withTimezone: true }).defaultNow().notNull(),
});
