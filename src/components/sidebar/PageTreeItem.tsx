import { useState } from "react";
import clsx from "clsx";
import { Page } from "@/types";
import { PageTreeNode } from "@/lib/page-utils";
import IconButton from "@/components/ui/IconButton";

interface Props {
  node: PageTreeNode;
  depth?: number;
  activePageId?: string | null;
  onSelect: (page: Page) => void;
  onCreateChild: (parentId: string) => void;
  onDelete: (pageId: string) => void;
  onRename: (pageId: string, title: string) => void;
}

export default function PageTreeItem({
  node,
  depth = 0,
  activePageId,
  onSelect,
  onCreateChild,
  onDelete,
  onRename,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.page.title);

  const hasChildren = node.children.length > 0;
  const isActive = activePageId === node.page.id;

  function commitRename() {
    const trimmed = renameValue.trim() || "Untitled";
    onRename(node.page.id, trimmed);
    setRenaming(false);
  }

  return (
    <div>
      {/* Row */}
      <div
        data-testid={`page-item-${node.page.id}`}
        role="treeitem"
        aria-selected={isActive}
        aria-expanded={hasChildren ? expanded : undefined}
        className={clsx(
          "group flex items-center gap-1 rounded-md px-2 py-1 text-sm cursor-pointer select-none",
          "transition-colors duration-100",
          isActive && "bg-lb-hover text-lb-text",
          !isActive && "text-lb-text-muted hover:bg-lb-hover/70 hover:text-lb-text"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => !renaming && onSelect(node.page)}
      >
        {/* Expand/collapse toggle */}
        <button
          aria-label={expanded ? "Collapse" : "Expand"}
          data-testid={`toggle-${node.page.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className={clsx(
            "w-4 h-4 flex-shrink-0 flex items-center justify-center",
            "rounded text-xs hover:bg-white/10 transition-colors",
            !hasChildren && "invisible"
          )}
        >
          {expanded ? "▾" : "▸"}
        </button>

        {/* Icon */}
        <span className="text-sm flex-shrink-0">{node.page.icon ?? "📄"}</span>

        {/* Title */}
        {renaming ? (
          <input
            autoFocus
            data-testid={`rename-input-${node.page.id}`}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-none outline-none text-lb-text flex-1 min-w-0"
          />
        ) : (
          <span
            className="truncate flex-1 min-w-0"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setRenaming(true);
              setRenameValue(node.page.title);
            }}
          >
            {node.page.title}
          </span>
        )}

        {/* Hover actions */}
        {hovered && !renaming && (
          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <IconButton
              label="Add sub-page"
              size="sm"
              data-testid={`add-child-${node.page.id}`}
              onClick={() => onCreateChild(node.page.id)}
            >
              +
            </IconButton>
            <IconButton
              label="Delete page"
              size="sm"
              data-testid={`delete-${node.page.id}`}
              onClick={() => onDelete(node.page.id)}
            >
              ✕
            </IconButton>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div data-testid={`children-${node.page.id}`}>
          {node.children.map((child) => (
            <PageTreeItem
              key={child.page.id}
              node={child}
              depth={depth + 1}
              activePageId={activePageId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
