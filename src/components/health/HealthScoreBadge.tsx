interface HealthScoreBadgeProps {
  score: number;
  tier: "poor" | "fair" | "good" | "excellent";
  size?: "sm" | "md" | "lg";
}

export default function HealthScoreBadge({ score, tier, size = "md" }: HealthScoreBadgeProps) {
  const colors = {
    poor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    fair: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    good: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    excellent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${colors[tier]} ${sizes[size]}`}
    >
      <span>{score}</span>
      <span className="opacity-60">/ 100</span>
    </span>
  );
}
