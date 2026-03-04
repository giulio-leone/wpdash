import { pgTable, uuid, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const seoAudits = pgTable("seo_audits", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull(),
  pageUrl: text("page_url").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  headersStructure: jsonb("headers_structure"), // { h1: [], h2: [], h3: [], counts: { h1, h2, h3 } }
  score: integer("score"), // 0-100
  auditedAt: timestamp("audited_at", { withTimezone: true }).defaultNow().notNull(),
});
