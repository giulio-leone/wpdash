import { pgTable, uuid, timestamp, boolean, varchar } from "drizzle-orm/pg-core";

export const sitePlugins = pgTable("site_plugins", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull(),
  hasUpdate: boolean("has_update").default(false).notNull(),
  latestVersion: varchar("latest_version", { length: 50 }),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
});
