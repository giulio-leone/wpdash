export interface UptimeCheck {
  id: string;
  siteId: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  isReachable: boolean;
  errorMessage: string | null;
  checkedAt: Date;
}
