export default function PageContentSkeleton() {
  return (
    <div
      data-testid="page-content-skeleton"
      className="flex flex-col h-full overflow-y-auto bg-lb-base"
      aria-hidden="true"
    >
      <div className="w-full h-32 sm:h-48 flex-shrink-0 bg-lb-surface border-b border-lb-border animate-pulse" />
      <div className="px-3 sm:px-8 lg:px-16 py-6 sm:py-8 flex-1">
        <div className="w-14 h-14 rounded-2xl bg-lb-border mb-4 animate-pulse" />
        <div className="h-10 w-3/5 rounded-md bg-lb-border mb-8 animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-lb-border animate-pulse" />
          <div className="h-4 w-11/12 rounded bg-lb-border animate-pulse" />
          <div className="h-4 w-4/5 rounded bg-lb-border animate-pulse" />
          <div className="h-4 w-full rounded bg-lb-border animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-lb-border animate-pulse" />
        </div>
      </div>
    </div>
  );
}
