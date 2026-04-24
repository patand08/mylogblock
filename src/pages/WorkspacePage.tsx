import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page } from "@/types";
import { useWorkspace } from "@/context/WorkspaceContext";
import Sidebar from "@/components/sidebar/Sidebar";
import SidebarSkeleton from "@/components/sidebar/SidebarSkeleton";
import SortablePageList from "@/components/sidebar/SortablePageList";
import EditorPage from "@/components/page/EditorPage";
import EmptyState from "@/components/page/EmptyState";
import PageContentSkeleton from "@/components/page/PageContentSkeleton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ThemeToggle from "@/components/ui/ThemeToggle";

const PAGE_TRANSITION_MS = 320;

export default function WorkspacePage() {
  const { pageId } = useParams<{ pageId?: string }>();
  const navigate = useNavigate();
  const { pages, tree, activePageId, setActivePageId, createPage, updatePage, deletePage, reorderPagesOpt, loading } = useWorkspace();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [pendingPage, setPendingPage] = useState<Page | null>(null);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // On direct URL load (/page/:pageId): wait for pages to load, then activate
  useEffect(() => {
    if (!pageId || loading) return;
    const found = pages.find((p) => p.id === pageId && !p.is_deleted);
    if (found) {
      if (activePageId !== found.id) {
        setActivePageId(found.id);
      }
    } else {
      navigate("/", { replace: true });
    }
  }, [pageId, pages, loading, activePageId, setActivePageId, navigate]);

  useEffect(() => {
    if (!isPageTransitioning) return;
    const timeout = window.setTimeout(() => setIsPageTransitioning(false), PAGE_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [isPageTransitioning, activePageId]);

  // Check if currently viewing a just-created page (before state propagates)
  // Active page: use pending page (just created) or find from pages state
  const activePage = pendingPage
    ? pendingPage
    : activePageId
      ? pages.find((p) => p.id === activePageId && !p.is_deleted) ?? null
      : null;

  const deleteTargetPage = deleteTarget
    ? pages.find((p) => p.id === deleteTarget) ?? null
    : null;

  function handleSelectPage(page: Page) {
    setIsPageTransitioning(true);
    setActivePageId(page.id);
    navigate(`/page/${page.id}`);
  }

  function handleCreatePage(parentId?: string) {
    setIsPageTransitioning(true);
    const page = createPage(
      { title: "Untitled", parent_id: parentId ?? null },
      (saved, localId) => {
        // Replace temporary local-id URL with persisted DB id to avoid route mismatch/flicker.
        navigate(`/page/${saved.id}`, { replace: true });
        setPendingPage((prev) => (prev?.id === localId ? null : prev));
      }
    );
    setPendingPage(page);
    setActivePageId(page.id);
    navigate(`/page/${page.id}`);
  }

  function handleRequestDelete(id: string) {
    setDeleteTarget(id);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deletePage(deleteTarget);
    if (activePageId === deleteTarget) {
      navigate("/", { replace: true });
    }
    setDeleteTarget(null);
  }

  function handleRenamePage(id: string, title: string) {
    updatePage(id, { title });
  }

  return (
    <div data-testid="workspace" className="flex flex-col h-screen bg-lb-base overflow-hidden sm:flex-row">
      {/* Mobile header with hamburger button */}
      <header className="sm:hidden flex items-center justify-between h-12 px-3 border-b border-lb-border bg-lb-surface">
        <button
          data-testid="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          className="p-1 rounded hover:bg-white/5 text-lb-text-muted hover:text-lb-text"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1 mx-2 min-w-0">
          <img src="/mylogblock-logo.png" alt="MyLogBlock logo" className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold font-display lb-gradient-text truncate">MyLogBlock</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      >
        {loading ? (
          <SidebarSkeleton />
        ) : (
          <SortablePageList
            tree={tree}
            activePageId={activePageId}
            onSelect={handleSelectPage}
            onCreatePage={handleCreatePage}
            onDeletePage={handleRequestDelete}
            onRenamePage={handleRenamePage}
            onReorderPages={reorderPagesOpt}
          />
        )}
      </Sidebar>

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
        className={`fixed left-0 top-0 h-full w-64 bg-lb-surface border-r border-lb-border transform transition-transform duration-200 sm:hidden z-50 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          top: "48px", // Height of mobile header
        }}
      >
        <div className="h-[calc(100vh-48px)] flex flex-col py-2">
          <div className="flex-1 overflow-y-auto px-2">
            {loading ? (
              <SidebarSkeleton />
            ) : (
              <SortablePageList
                tree={tree}
                activePageId={activePageId}
                onSelect={(page) => {
                  handleSelectPage(page);
                  setMobileMenuOpen(false);
                }}
                onCreatePage={handleCreatePage}
                onDeletePage={handleRequestDelete}
                onRenamePage={handleRenamePage}
                onReorderPages={reorderPagesOpt}
              />
            )}
          </div>
          {/* Night mode toggle - bottom of mobile drawer */}
          <div className="px-3 py-3 border-t border-lb-border">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        {activePage && isPageTransitioning ? (
          <PageContentSkeleton />
        ) : activePage ? (
          <EditorPage
            page={activePage}
            allPages={pages}
            onNavigate={handleSelectPage}
            onUpdatePage={updatePage}
          />
        ) : (
          <EmptyState onCreatePage={() => handleCreatePage()} />
        )}
      </main>

      <ConfirmModal
        open={deleteTarget !== null}
        title={`Delete "${deleteTargetPage?.title ?? "page"}"?`}
        description="This page and all its sub-pages will be deleted. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
