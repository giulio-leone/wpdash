import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const uptimeChecks = pgTable("uptime_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull(),
  statusCode: integer("status_code"),
  responseTimeMs: integer("response_time_ms"),
  isReachable: boolean("is_reachable").notNull(),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
});
