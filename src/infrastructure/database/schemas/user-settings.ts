import { pgTable, uuid, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey(),
  notifyOffline: boolean("notify_offline").notNull().default(true),
  notifyUpdates: boolean("notify_updates").notNull().default(true),
  notifyBackupStale: boolean("notify_backup_stale").notNull().default(true),
  backupStaleDays: integer("backup_stale_days").notNull().default(7),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
