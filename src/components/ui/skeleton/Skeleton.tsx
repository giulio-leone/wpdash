import { cn } from "@/lib/cn";

interface Props {
  className?: string;
}

export function Skeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700/60",
        className,
      )}
    />
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  const widths = ["w-40", "w-20", "w-16", "w-24", "w-32"];
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 pr-4">
          <Skeleton className={cn("h-4", widths[i] ?? "w-20")} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-800">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="pb-3 pr-4">
              <Skeleton className="h-3 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <SkeletonTableRow key={r} cols={cols} />
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}
