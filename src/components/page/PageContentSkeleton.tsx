export default function PageContentSkeleton() {
  return (
    <div
      data-testid="page-content-skeleton"
      className="flex flex-col h-full overflow-y-auto bg-lb-base"
      aria-hidden="true"
    >
      <div className="w-full h-32 sm:h-48 flex-shrink-0 border-b border-lb-border lb-skeleton-shimmer" />
      <div className="px-3 sm:px-8 lg:px-16 py-6 sm:py-8 flex-1">
        <div className="w-14 h-14 rounded-2xl mb-4 lb-skeleton-shimmer" />
        <div className="h-10 w-3/5 rounded-md mb-8 lb-skeleton-shimmer" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded lb-skeleton-shimmer" />
          <div className="h-4 w-11/12 rounded lb-skeleton-shimmer" />
          <div className="h-4 w-4/5 rounded lb-skeleton-shimmer" />
          <div className="h-4 w-full rounded lb-skeleton-shimmer" />
          <div className="h-4 w-2/3 rounded lb-skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
