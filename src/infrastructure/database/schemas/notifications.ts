import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type", { enum: ["site_offline", "update_available", "backup_stale", "info"] }).notNull(),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }),
  siteName: text("site_name"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
