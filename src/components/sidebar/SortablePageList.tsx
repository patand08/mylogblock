import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Page } from "@/types";
import { PageTreeNode } from "@/lib/page-utils";
import SortablePageItem from "./SortablePageItem";
import Button from "@/components/ui/Button";

interface Props {
  tree: PageTreeNode[];
  activePageId?: string | null;
  onSelect: (page: Page) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
  onReorderPages: (activeId: string, overId: string) => void;
}

function flattenTree(nodes: PageTreeNode[]): PageTreeNode[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}

export default function SortablePageList({
  tree,
  activePageId,
  onSelect,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  onReorderPages,
}: Props) {
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderPages(String(active.id), String(over.id));
    }
  }

  const query = search.trim().toLowerCase();
  const visibleTree = query
    ? flattenTree(tree)
        .filter((n) => n.page.title.toLowerCase().includes(query))
        .map((n) => ({ ...n, children: [] }))
    : tree;

  const rootIds = visibleTree.map((n) => n.page.id);

  return (
    <div data-testid="page-list" role="tree" aria-label="Pages">
      {/* Search */}
      <div className="px-3 pb-1">
        <input
          data-testid="page-search"
          type="text"
          placeholder="Search pages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-lb-border rounded-md px-2 py-1 text-xs
                     text-lb-text placeholder-lb-text-muted/50 outline-none focus:border-lb-neon-purple/50"
        />
      </div>

      {visibleTree.length === 0 && query ? (
        <p data-testid="search-no-results" className="text-xs text-lb-text-muted px-3 py-2">
          No pages match "{search}"
        </p>
      ) : visibleTree.length === 0 ? (
        <p className="text-xs text-lb-text-muted px-3 py-2">No pages yet</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
            {visibleTree.map((node) => (
              <SortablePageItem
                key={node.page.id}
                node={node}
                activePageId={activePageId}
                onSelect={onSelect}
                onCreateChild={onCreatePage}
                onDelete={onDeletePage}
                onRename={onRenamePage}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <div className="px-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          data-testid="new-page-btn"
          className="w-full justify-start text-lb-text-muted"
          onClick={() => onCreatePage(undefined)}
        >
          <span>+</span>
          <span>New page</span>
        </Button>
      </div>
    </div>
  );
}
