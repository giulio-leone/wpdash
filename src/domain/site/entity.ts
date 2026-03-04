export type SiteStatus = "online" | "offline" | "degraded" | "unknown";

export interface Site {
  id: string;
  userId: string;
  name: string;
  url: string;
  isActive: boolean;
  status: SiteStatus;
  lastCheckedAt: Date | null;
  wpVersion: string | null;
  phpVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSiteInput {
  userId: string;
  name: string;
  url: string;
}

export interface UpdateSiteInput {
  name?: string;
  url?: string;
  isActive?: boolean;
  status?: SiteStatus;
  wpVersion?: string;
  phpVersion?: string;
}
