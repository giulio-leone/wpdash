export type BackupStatus = "recent" | "stale" | "unknown";

export interface BackupRecord {
  id: string;
  siteId: string;
  lastBackupAt: Date | null;
  archiveSizeBytes: number | null;
  status: BackupStatus;
  checkedAt: Date;
}
