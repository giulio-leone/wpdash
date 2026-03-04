import { eq, desc } from "drizzle-orm";
import { db } from "../drizzle-client";
import { backupRecords } from "../schemas/backup-records";
import type { BackupRecord, BackupStatus } from "@/domain/backup/entity";
import type { BackupRecordRepository } from "@/ports/repositories/backup-record-repository";

function mapRow(row: typeof backupRecords.$inferSelect): BackupRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    lastBackupAt: row.lastBackupAt,
    archiveSizeBytes: row.archiveSizeBytes,
    status: row.status as BackupStatus,
    checkedAt: row.checkedAt,
  };
}

export class DrizzleBackupRepository implements BackupRecordRepository {
  async upsert(record: Omit<BackupRecord, "id">): Promise<BackupRecord> {
    const rows = await db
      .insert(backupRecords)
      .values({
        siteId: record.siteId,
        lastBackupAt: record.lastBackupAt,
        archiveSizeBytes: record.archiveSizeBytes,
        status: record.status,
        checkedAt: record.checkedAt,
      })
      .returning();
    return mapRow(rows[0]!);
  }

  async findBySiteId(siteId: string): Promise<BackupRecord[]> {
    const rows = await db
      .select()
      .from(backupRecords)
      .where(eq(backupRecords.siteId, siteId))
      .orderBy(desc(backupRecords.checkedAt));
    return rows.map(mapRow);
  }

  async getLatestBySiteId(siteId: string): Promise<BackupRecord | null> {
    const rows = await db
      .select()
      .from(backupRecords)
      .where(eq(backupRecords.siteId, siteId))
      .orderBy(desc(backupRecords.checkedAt))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findStale(): Promise<BackupRecord[]> {
    const rows = await db
      .select()
      .from(backupRecords)
      .where(eq(backupRecords.status, "stale"));
    return rows.map(mapRow);
  }
}
