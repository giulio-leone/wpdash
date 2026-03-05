import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull(), // references auth.users
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  avatarUrl: text("avatar_url"),
  plan: varchar("plan", { length: 20 }).notNull().default("free"), // free | pro | enterprise
  sitesLimit: integer("sites_limit").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orgMembers = pgTable("org_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"), // owner | admin | member
  inviteEmail: text("invite_email"),
  inviteToken: text("invite_token"),
  inviteAccepted: boolean("invite_accepted").notNull().default(false),
  invitedAt: timestamp("invited_at", { withTimezone: true }).defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});
