interface Props {
  onCreatePage: () => void;
}

export default function EmptyState({ onCreatePage }: Props) {
  return (
    <div
      data-testid="empty-state"
      className="relative h-full flex flex-col items-center justify-center gap-8 px-8 overflow-hidden"
    >
      {/* Y2K decorative background shape */}
      <img
        src="/y2k-shape-112.svg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none select-none"
      />
      {/* Content above bg */}
      <div className="relative z-10 flex flex-col items-center gap-8">

      {/* Logo */}
      <img
        src="/mylogblock-logo.png"
        alt="MyLogBlock"
        className="w-32 h-32 opacity-80"
      />

      <div className="text-center">
        <h2 className="text-3xl font-brand lb-gradient-text mb-2">
          MyLogBlock
        </h2>
        <p className="text-sm font-body text-emerald-500/85 mb-4 tracking-widest uppercase">
           Block based note taker
        </p>
        <p className="text-lb-text-muted max-w-sm text-sm">
          Create a page to start building.
        </p>
      </div>

      <button
        data-testid="create-first-page-btn"
        onClick={onCreatePage}
        className="px-6 py-3 rounded-lg font-bold font-display bg-emerald-600 hover:bg-emerald-500
                   text-white transition-colors flex items-center gap-2"
      >
        <span>+</span>
        <span>Create page</span>
      </button>
      </div>{/* end z-10 */}
    </div>
  );
}
