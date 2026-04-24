import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) containerRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-testid="confirm-modal"
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop with blur */}
      <div
        data-testid="confirm-modal-backdrop"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 bg-lb-surface border border-lb-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-lb-text mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-lb-text-muted mb-6">{description}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            data-testid="cancel-btn"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg text-lb-text-muted hover:text-lb-text hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            data-testid="confirm-btn"
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-lb-danger-brown hover:bg-lb-danger-brown/90 text-white font-medium transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
