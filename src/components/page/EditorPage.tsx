import { useRef, useCallback } from "react";
import { Page, UpdatePageInput } from "@/types";
import { getPageBreadcrumbs } from "@/lib/page-utils";
import PageHeader from "./PageHeader";
import BlockEditor from "@/components/editor/BlockEditor";
import { PartialBlock } from "@blocknote/core";

interface Props {
  page: Page;
  allPages: Page[];
  onNavigate: (page: Page) => void;
  onUpdatePage: (pageId: string, update: UpdatePageInput) => void;
}

function formatRelativeTime(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const SAVE_DEBOUNCE_MS = 800;

export default function EditorPage({ page, allPages, onNavigate, onUpdatePage }: Props) {
  const crumbs = getPageBreadcrumbs(allPages, page.id);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBlocksChange = useCallback((blocks: PartialBlock[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdatePage(page.id, { body: blocks as unknown });
    }, SAVE_DEBOUNCE_MS);
  }, [page.id, onUpdatePage]);

  return (
    <div data-testid="editor-page" className="flex flex-col h-full overflow-y-auto">
      <PageHeader
        page={page}
        crumbs={crumbs}
        onNavigate={onNavigate}
        onUpdate={onUpdatePage}
      />

      <div data-testid="editor-content" className="flex-1 px-4 sm:px-8 lg:px-16 pb-4 sm:pb-8 lg:pb-16">
        {page.updated_at && (
          <p data-testid="last-edited" className="text-xs text-lb-text-muted mb-4">
            Edited {formatRelativeTime(page.updated_at)}
          </p>
        )}
        <BlockEditor
          pageId={page.id}
          initialContent={Array.isArray(page.body) && page.body.length > 0 ? page.body as PartialBlock[] : undefined}
          onChange={handleBlocksChange}
        />
      </div>
    </div>
  );
}
