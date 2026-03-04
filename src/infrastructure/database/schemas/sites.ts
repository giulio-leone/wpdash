import { pgTable, uuid, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(), // references auth.users
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  tokenHash: text("token_hash").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  status: varchar("status", { length: 20 }).default("unknown").notNull(), // online | offline | degraded | unknown
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  wpVersion: varchar("wp_version", { length: 20 }),
  phpVersion: varchar("php_version", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
