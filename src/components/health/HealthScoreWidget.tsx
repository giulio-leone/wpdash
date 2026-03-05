"use client";
import { useEffect, useState } from "react";
import { getSiteHealthScore, type HealthScore } from "@/application/health/health-score-actions";

const TIER_COLORS = {
  poor: "#ef4444",
  fair: "#eab308",
  good: "#3b82f6",
  excellent: "#22c55e",
};

function CircularProgress({ score, color }: { score: number; color: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        className="text-gray-100 dark:text-white/10"
      />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

export default function HealthScoreWidget({ siteId }: { siteId: string }) {
  const [hs, setHs] = useState<HealthScore | null>(null);

  useEffect(() => {
    getSiteHealthScore(siteId).then(setHs);
  }, [siteId]);

  if (!hs) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Loading health score…
      </div>
    );
  }

  const color = TIER_COLORS[hs.tier];
  const label = hs.tier.charAt(0).toUpperCase() + hs.tier.slice(1);

  const components = [
    { label: "Uptime", value: hs.components.uptime, max: 40 },
    { label: "Security", value: hs.components.security, max: 25 },
    { label: "Updates", value: hs.components.updates, max: 20 },
    { label: "Backup", value: hs.components.backup, max: 15 },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        <CircularProgress score={hs.total} color={color} />
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {hs.total}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
        </div>
      </div>
      <div className="w-full space-y-2">
        {components.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">
              {c.label}
            </span>
            <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(c.value / c.max) * 100}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">
              {c.value}/{c.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
