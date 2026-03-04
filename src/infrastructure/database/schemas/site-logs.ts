import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const siteLogs = pgTable("site_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull(),
  level: varchar("level", { length: 20 }).notNull(), // critical | error | warning | notice | info
  message: text("message").notNull(),
  source: varchar("source", { length: 255 }),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});
