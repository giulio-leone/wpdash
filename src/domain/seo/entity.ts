export interface HeadersStructure {
  h1: string[];
  h2: string[];
  h3: string[];
}

export interface SeoAudit {
  id: string;
  siteId: string;
  pageUrl: string;
  title: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  headersStructure: HeadersStructure;
  score: number;
  auditedAt: Date;
}
