import type { Site, CreateSiteInput, UpdateSiteInput } from "@/domain/site/entity";

export interface SiteRepository {
  findById(id: string): Promise<Site | null>;
  findByUserId(userId: string): Promise<Site[]>;
  findByUrl(url: string, userId: string): Promise<Site | null>;
  create(input: CreateSiteInput, tokenHash: string): Promise<Site>;
  update(id: string, input: UpdateSiteInput): Promise<Site | null>;
  delete(id: string): Promise<boolean>;
  findAllActive(): Promise<Site[]>;
}
