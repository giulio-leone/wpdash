import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const userPlans = pgTable("user_plans", {
  userId: uuid("user_id").primaryKey(),
  plan: varchar("plan", { length: 20 }).notNull().default("free"), // free | pro | enterprise
  sitesLimit: integer("sites_limit").notNull().default(3), // -1 = unlimited
  trialExpiresAt: timestamp("trial_expires_at", { withTimezone: true }),
  upgradedAt: timestamp("upgraded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  userId: uuid("user_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
