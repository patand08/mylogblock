import "@/components/editor/editor-theme.css";
import PageContentSkeleton from "@/components/page/PageContentSkeleton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { buildPageTree, PageTreeNode } from "@/lib/page-utils";
import { fetchPages } from "@/lib/pageRepo";
import { sanitizeBlocks } from "@/lib/sanitizeBlocks";
import { Page } from "@/types";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  PartialBlock,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import clsx from "clsx";
import twemoji from "twemoji";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Twemoji from "@/components/ui/Twemoji";
import { TWEMOJI_SVG_OPTIONS } from "@/components/ui/Twemoji";

const PAGE_TRANSITION_MS = 320;

const readOnlySchema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs },
});

// Walk up to find the top-level ancestor of a page
function findRootAncestor(allPages: Page[], pageId: string): Page {
  const map = new Map(allPages.map((p) => [p.id, p]));
  let current = map.get(pageId)!;
  while (current.parent_id && map.has(current.parent_id)) {
    current = map.get(current.parent_id)!;
  }
  return current;
}

// Collect a page + all its descendants
function collectSubtree(allPages: Page[], rootId: string): Page[] {
  const result: Page[] = [];
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift()!;
    const page = allPages.find((p) => p.id === id);
    if (!page) continue;
    result.push(page);
    allPages.filter((p) => p.parent_id === id).forEach((p) => queue.push(p.id));
  }
  return result;
}

function SubtreeItem({
  node,
  activeId,
  onSelect,
  depth = 0,
}: {
  node: PageTreeNode;
  activeId: string;
  onSelect: (page: Page) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.page.id === activeId;

  return (
    <div>
      <div
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        className={`flex items-center gap-1.5 py-1 pr-2 rounded-md text-sm cursor-pointer select-none
          transition-colors duration-100
          ${isActive ? "bg-lb-hover text-lb-text" : "text-lb-text-muted hover:bg-lb-hover/70 hover:text-lb-text"}`}
        onClick={() => onSelect(node.page)}
      >
        <button
          className={`w-4 h-4 flex-shrink-0 flex items-center justify-center rounded text-xs
            hover:bg-white/10 transition-colors ${!hasChildren ? "invisible" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <Twemoji text={node.page.icon ?? "📄"} className="text-sm flex-shrink-0" />
        <span className="truncate">{node.page.title}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <SubtreeItem
              key={child.page.id}
              node={child}
              activeId={activeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReadOnlyEditor({ body }: { body: unknown }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const safeContent = useMemo(() => {
    if (!Array.isArray(body) || body.length === 0) return undefined;
    try {
      const sanitized = sanitizeBlocks(body) as PartialBlock[];
      return sanitized.length > 0 ? sanitized : undefined;
    } catch {
      return undefined;
    }
  }, [body]);

  const editor = useCreateBlockNote({
    schema: readOnlySchema,
    initialContent: safeContent as any,
    tables: {
      splitCells: true,
      cellBackgroundColor: true,
      cellTextColor: true,
      headers: true,
    },
  });

  useLayoutEffect(() => {
    const run = () => {
      const root = hostRef.current?.querySelector(".ProseMirror");
      if (root instanceof HTMLElement) {
        twemoji.parse(root, TWEMOJI_SVG_OPTIONS);
      }
    };
    run();
    const id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [editor, safeContent]);

  return (
    <div ref={hostRef} className="w-full read-only-editor">
      <BlockNoteView editor={editor} theme="light" editable={false} />
    </div>
  );
}

export default function ReadOnlyPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [, setAllPages] = useState<Page[]>([]);
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [tree, setTree] = useState<PageTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  useEffect(() => {
    fetchPages("local-workspace")
      .then((pages) => {
        const linked = pages.find((p) => p.id === pageId && !p.is_deleted);
        if (!linked) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        // Always root the tree at the top-level ancestor
        const ancestor = findRootAncestor(pages, linked.id);
        const subtree = collectSubtree(pages, ancestor.id);
        setAllPages(subtree);
        setTree(buildPageTree(subtree));
        setActivePage(linked); // open the specifically linked page
      })
      .finally(() => setLoading(false));
  }, [pageId]);

  useEffect(() => {
    if (!isPageTransitioning) return;
    const timeout = window.setTimeout(() => setIsPageTransitioning(false), PAGE_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [isPageTransitioning, activePage?.id]);

  function handleSelect(page: Page) {
    setIsPageTransitioning(true);
    setActivePage(page);
    navigate(`/page/${page.id}`, { replace: true });
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-lb-base">
        <div className="w-5 h-5 rounded-full border-2 border-lb-neon-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-lb-base text-lb-text-muted">
        <span className="text-4xl">🔍</span>
        <p className="font-display">Page not found</p>
      </div>
    );
  }

  const renderSidebar = () => (
    <aside
      className={clsx(
        "flex-shrink-0 flex flex-col h-full bg-lb-sidebar border-r border-lb-border transition-all duration-200",
        sidebarCollapsed ? "w-12" : "w-64",
      )}
    >
      <div className="lb-sidebar-accent" />
      <div className="flex items-center justify-between px-3 py-3 border-b border-lb-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/mylogblock-logo.png"
              alt="MyLogBlock logo"
              className="h-5 shrink-0"
            />
            <span className="text-sm font-brand truncate lb-gradient-text">
              MyLogBlock
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <img
            src="/mylogblock-logo.png"
            alt="MyLogBlock logo"
            className="h-5 mx-auto"
          />
        )}
        <button
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded hover:bg-white/5 text-lb-text-muted hover:text-lb-text ml-auto shrink-0"
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {!sidebarCollapsed && (
          tree.map((node) => (
            <SubtreeItem
              key={node.page.id}
              node={node}
              activeId={activePage?.id ?? ""}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
      <div
        className={clsx(
          "py-2 border-t border-lb-border flex",
          sidebarCollapsed ? "justify-center px-0" : "px-3",
        )}
      >
        <ThemeToggle />
      </div>
    </aside>
  );

  return (
    <div className="flex flex-col h-screen bg-lb-base overflow-hidden sm:flex-row">
      {/* Mobile header with hamburger button */}
      <header className="sm:hidden flex items-center justify-between h-12 px-3 border-b border-lb-border bg-lb-sidebar">
        <button
          data-testid="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          className="p-1 rounded hover:bg-white/5 text-lb-text-muted hover:text-lb-text"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1 mx-2 min-w-0">
          <img
            src="/mylogblock-logo.png"
            alt="MyLogBlock logo"
            className="w-5 h-5 shrink-0"
          />
          <span className="text-sm font-brand lb-gradient-text truncate">
            MyLogBlock
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden sm:flex sm:h-screen sm:flex-col">
        {renderSidebar()}
      </div>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          data-testid="mobile-drawer-overlay"
          className="fixed inset-0 bg-black/50 sm:hidden z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer menu */}
      <div
        data-testid="mobile-drawer"
        className={`fixed left-0 top-0 h-full w-64 bg-lb-sidebar border-r border-lb-border transform transition-transform duration-200 sm:hidden z-50 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          top: "48px", // Height of mobile header
        }}
      >
        <div className="h-[calc(100vh-48px)] flex flex-col py-2">
          {tree.map((node) => (
            <SubtreeItem
              key={node.page.id}
              node={node}
              activeId={activePage?.id ?? ""}
              onSelect={(page) => {
                handleSelect(page);
                setMobileMenuOpen(false);
              }}
            />
          ))}
          {/* Night mode toggle - bottom of mobile drawer */}
          <div className="px-3 py-3 border-t border-lb-border">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activePage && isPageTransitioning ? (
          <PageContentSkeleton />
        ) : activePage && (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Cover */}
            {activePage.cover_image_url && (
              <div className="w-full h-32 sm:h-48 flex-shrink-0 overflow-hidden">
                <img
                  src={activePage.cover_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: `center ${activePage.cover_image_position ?? 50}%`,
                  }}
                />
              </div>
            )}
            <div
              className={clsx(
                "px-3 sm:px-8 lg:px-16 flex-1",
                activePage.cover_image_url ? "py-6 sm:py-8" : "pt-12 sm:pt-20 pb-6 sm:pb-8",
              )}
            >
              <div className="flex items-center gap-3 mb-6">
                {activePage.icon && (
                  <Twemoji text={activePage.icon} className="text-4xl leading-none" />
                )}
                <h1 className="text-3xl sm:text-4xl font-bold font-display text-lb-text">
                  {activePage.title}
                </h1>
              </div>
              <ReadOnlyEditor key={activePage.id} body={activePage.body} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
