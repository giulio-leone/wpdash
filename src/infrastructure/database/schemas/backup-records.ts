import { pgTable, uuid, timestamp, bigint, varchar } from "drizzle-orm/pg-core";

export const backupRecords = pgTable("backup_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull(),
  lastBackupAt: timestamp("last_backup_at", { withTimezone: true }),
  archiveSizeBytes: bigint("archive_size_bytes", { mode: "number" }),
  status: varchar("status", { length: 20 }).notNull(), // recent | stale | unknown
  checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
});
