interface Props {
  compact?: boolean;
  rows?: number;
}

export default function SidebarSkeleton({ compact = false, rows = 8 }: Props) {
  return (
    <div className="px-2 py-1" data-testid="sidebar-skeleton" aria-hidden="true">
      {!compact && <div className="h-8 rounded-md lb-skeleton-shimmer mb-3" />}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1">
            <div className="w-3 h-3 rounded lb-skeleton-shimmer" />
            <div
              className="h-3 rounded lb-skeleton-shimmer"
              style={{ width: `${Math.max(35, 92 - i * 7)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
