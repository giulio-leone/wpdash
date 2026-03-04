import type { BackupRecord } from "@/domain/backup/entity";

export interface BackupRecordRepository {
  upsert(record: Omit<BackupRecord, "id">): Promise<BackupRecord>;
  findBySiteId(siteId: string): Promise<BackupRecord[]>;
  getLatestBySiteId(siteId: string): Promise<BackupRecord | null>;
  findStale(): Promise<BackupRecord[]>;
}
