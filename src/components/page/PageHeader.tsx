import { useRef, useState, useCallback } from "react";
import { Page, UpdatePageInput } from "@/types";
import Breadcrumb from "./Breadcrumb";
import SlugModal from "./SlugModal";
import EmojiPickerPopover from "@/components/ui/EmojiPickerPopover";
import { uploadCoverImage } from "@/lib/storageRepo";
import clsx from "clsx";

interface Props {
  page: Page;
  crumbs: Page[];
  onNavigate: (page: Page) => void;
  onUpdate: (pageId: string, update: UpdatePageInput) => void;
}

export default function PageHeader({ page, crumbs, onNavigate, onUpdate }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(page.title);
  const [slugModalOpen, setSlugModalOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [repositioning, setRepositioning] = useState(false);
  const [draftPosition, setDraftPosition] = useState(page.cover_image_position ?? 50);
  const dragStartY = useRef<number | null>(null);
  const dragStartPos = useRef<number>(50);

  function commitTitle() {
    const trimmed = titleValue.trim() || "Untitled";
    onUpdate(page.id, { title: trimmed });
    setTitleValue(trimmed);
    setEditingTitle(false);
  }

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const url = await uploadCoverImage(page.id, file);
      onUpdate(page.id, { cover_image_url: url });
    } catch {
      // silent — add toast later
    }
  }

  const handleRepoDragStart = useCallback((e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
    dragStartPos.current = draftPosition;

    function onMove(ev: MouseEvent) {
      if (dragStartY.current === null) return;
      const delta = ev.clientY - dragStartY.current;
      // 192px = h-48, move 1% per ~1.5px of drag
      const newPos = Math.min(100, Math.max(0, dragStartPos.current - delta / 1.92));
      setDraftPosition(newPos);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      dragStartY.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [draftPosition]);

  function savePosition() {
    onUpdate(page.id, { cover_image_position: draftPosition });
    setRepositioning(false);
  }

  function cancelReposition() {
    setDraftPosition(page.cover_image_position ?? 50);
    setRepositioning(false);
  }

  const coverPosition = repositioning ? draftPosition : (page.cover_image_position ?? 50);

  return (
    <>
    <header data-testid="page-header" className="w-full">
      {/* Cover image */}
      {page.cover_image_url ? (
        <div className="relative group">
          <div
            data-testid="cover-image"
            className={clsx(
              "w-full h-32 sm:h-48 bg-cover select-none",
              repositioning ? "cursor-grab active:cursor-grabbing" : ""
            )}
            style={{
              backgroundImage: `url(${page.cover_image_url})`,
              backgroundPositionX: "center",
              backgroundPositionY: `${coverPosition}%`,
            }}
            onMouseDown={repositioning ? handleRepoDragStart : undefined}
          />

          {/* Reposition mode controls */}
          {repositioning ? (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={savePosition}
                className="px-3 py-1 text-xs bg-lb-neon-purple text-black font-semibold rounded"
              >
                Save position
              </button>
              <button
                onClick={cancelReposition}
                className="px-3 py-1 text-xs bg-black/60 text-white rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                data-testid="reposition-cover-btn"
                onClick={() => { setDraftPosition(page.cover_image_position ?? 50); setRepositioning(true); }}
                className="px-2 py-1 text-xs bg-black/60 text-white rounded"
              >
                Reposition
              </button>
              <button
                onClick={() => coverInputRef.current?.click()}
                className="px-2 py-1 text-xs bg-black/60 text-white rounded"
              >
                Change
              </button>
              <button
                data-testid="remove-cover-btn"
                onClick={() => onUpdate(page.id, { cover_image_url: null })}
                className="px-2 py-1 text-xs bg-black/60 text-white rounded"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Hidden file input — must be outside conditional so ref is always mounted */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleCoverFileChange}
      />

      <div className={clsx("px-4 sm:px-8 lg:px-16 pb-4", page.cover_image_url ? "pt-3" : "pt-6 sm:pt-12")}>
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb
            crumbs={crumbs}
            onNavigate={onNavigate}
            onSlugClick={() => setSlugModalOpen(true)}
          />
        </div>

        {/* Add cover button — shown when no cover */}
        {!page.cover_image_url && (
          <div className="mb-3">
            <button
              data-testid="add-cover-btn"
              onClick={() => coverInputRef.current?.click()}
              className="text-xs text-lb-text-muted hover:text-lb-text transition-colors"
            >
              + Add cover
            </button>
          </div>
        )}

        {/* Icon + Title inline */}
        <div data-testid="page-icon" className="flex items-center gap-3">
          <EmojiPickerPopover
            value={page.icon}
            onChange={(emoji) => onUpdate(page.id, { icon: emoji })}
          />

          {editingTitle ? (
            <input
              data-testid="page-title-input"
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitTitle(); }
                if (e.key === "Escape") { setTitleValue(page.title); setEditingTitle(false); }
              }}
              placeholder="Untitled"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display bg-transparent border-none outline-none
                         text-lb-text flex-1 placeholder-lb-text-muted/40 caret-lb-neon-purple"
            />
          ) : (
            <h1
              data-testid="page-title"
              className="text-4xl font-bold font-display text-lb-text cursor-text flex-1
                         hover:bg-white/3 rounded px-1 -mx-1 transition-colors"
              onClick={() => { setEditingTitle(true); setTitleValue(page.title); }}
            >
              {page.title || <span className="text-lb-text-muted/40">Untitled</span>}
            </h1>
          )}
        </div>
      </div>
    </header>

    <SlugModal
      page={page}
      open={slugModalOpen}
      onClose={() => setSlugModalOpen(false)}
      onSaved={(slug) => onUpdate(page.id, { slug })}
    />
  </>
  );
}
