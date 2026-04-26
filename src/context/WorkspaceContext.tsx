import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Page, CreatePageInput, UpdatePageInput } from "@/types";
import { createPageObject, applyPageUpdate, buildPageTree, PageTreeNode } from "@/lib/page-utils";
import { reorderPages } from "@/lib/drag-utils";
import {
  pageKeys,
  useCreatePageMutation,
  useDeletePageMutation,
  useReorderPagesMutation,
  useUpdatePageMutation,
  useWorkspacePagesQuery,
} from "@/lib/pageQueries";

const WORKSPACE_ID = "local-workspace";

interface WorkspaceContextValue {
  pages: Page[];
  tree: PageTreeNode[];
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
  createPage: (
    input: CreatePageInput,
    onPersisted?: (saved: Page, localId: string) => void
  ) => Page;
  updatePage: (id: string, updates: UpdatePageInput) => void;
  deletePage: (id: string) => void;
  reorderPagesOpt: (activeId: string, overId: string, horizontalDelta?: number) => void;
  loading: boolean;
  error: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading, error: queryError } = useWorkspacePagesQuery(WORKSPACE_ID);
  const createPageMutation = useCreatePageMutation();
  const updatePageMutation = useUpdatePageMutation();
  const deletePageMutation = useDeletePageMutation();
  const reorderPagesMutation = useReorderPagesMutation();

  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingLocalUpdates = useRef(new Map<string, UpdatePageInput>());

  const workspaceKey = pageKeys.workspace(WORKSPACE_ID);

  const createPage = useCallback((
    input: CreatePageInput,
    onPersisted?: (saved: Page, localId: string) => void
  ): Page => {
    const siblings = pages.filter((p) => p.parent_id === (input.parent_id ?? null) && !p.is_deleted);
    const maxOrder = siblings.reduce((m, p) => Math.max(m, p.order_index), -1);
    const local = createPageObject(input, WORKSPACE_ID, maxOrder + 1);
    pendingLocalUpdates.current.set(local.id, {});
    const previousPages = queryClient.getQueryData<Page[]>(workspaceKey) ?? [];
    queryClient.setQueryData<Page[]>(workspaceKey, [...previousPages, local]);

    // Persist to DB in background; swap local ID → DB ID when done
    createPageMutation.mutate(
      { ...input, workspace_id: WORKSPACE_ID, order_index: maxOrder + 1 },
      {
        onSuccess: (saved) => {
          const pendingUpdates = pendingLocalUpdates.current.get(local.id) ?? {};
          pendingLocalUpdates.current.delete(local.id);
          const savedWithPendingUpdates = applyPageUpdate(saved, pendingUpdates);
          queryClient.setQueryData<Page[]>(
            workspaceKey,
            (prev = []) => prev.map((p) => (p.id === local.id ? savedWithPendingUpdates : p))
          );
          setActivePageId((prev) => (prev === local.id ? saved.id : prev));
          if (Object.keys(pendingUpdates).length > 0) {
            updatePageMutation.mutate(
              { id: saved.id, updates: pendingUpdates },
              {
                onError: (e: unknown) => {
                  setError(e instanceof Error ? e.message : "Failed to update page");
                },
              }
            );
          }
          onPersisted?.(savedWithPendingUpdates, local.id);
          setError(null);
        },
        onError: (e: unknown) => {
          pendingLocalUpdates.current.delete(local.id);
          queryClient.setQueryData<Page[]>(
            workspaceKey,
            (prev = []) => prev.filter((p) => p.id !== local.id)
          );
          setError(e instanceof Error ? e.message : "Failed to create page");
        },
      }
    );
    return local;
  }, [createPageMutation, pages, queryClient, updatePageMutation, workspaceKey]);

  const updatePage = useCallback((id: string, updates: UpdatePageInput): void => {
    const previousPages = queryClient.getQueryData<Page[]>(workspaceKey) ?? [];
    queryClient.setQueryData<Page[]>(
      workspaceKey,
      previousPages.map((p) => (p.id === id ? applyPageUpdate(p, updates) : p))
    );
    if (pendingLocalUpdates.current.has(id)) {
      pendingLocalUpdates.current.set(id, {
        ...pendingLocalUpdates.current.get(id),
        ...updates,
      });
      return;
    }
    updatePageMutation.mutate(
      { id, updates },
      {
        onError: (e: unknown) => {
          queryClient.setQueryData<Page[]>(workspaceKey, previousPages);
          setError(e instanceof Error ? e.message : "Failed to update page");
        },
      }
    );
  }, [queryClient, updatePageMutation, workspaceKey]);

  const deletePage = useCallback((id: string): void => {
    const previousPages = queryClient.getQueryData<Page[]>(workspaceKey) ?? [];
    queryClient.setQueryData<Page[]>(
      workspaceKey,
      previousPages.map((p) => (p.id === id ? { ...p, is_deleted: true } : p))
    );
    setActivePageId((prev) => (prev === id ? null : prev));
    deletePageMutation.mutate(id, {
      onError: (e: unknown) => {
        queryClient.setQueryData<Page[]>(workspaceKey, previousPages);
        setError(e instanceof Error ? e.message : "Failed to delete page");
      },
    });
  }, [deletePageMutation, queryClient, workspaceKey]);

  const reorderPagesOpt = useCallback((activeId: string, overId: string, horizontalDelta = 0) => {
    const previousPages = queryClient.getQueryData<Page[]>(workspaceKey) ?? [];
    const reordered = reorderPages(previousPages, activeId, overId, horizontalDelta);
    queryClient.setQueryData<Page[]>(workspaceKey, reordered);
    const updates = reordered
      .filter((p) => !p.is_deleted)
      .filter((p) => {
        const previous = previousPages.find((prev) => prev.id === p.id);
        const changed = previous && (previous.order_index !== p.order_index || previous.parent_id !== p.parent_id);
        if (changed && pendingLocalUpdates.current.has(p.id)) {
          pendingLocalUpdates.current.set(p.id, {
            ...pendingLocalUpdates.current.get(p.id),
            order_index: p.order_index,
            parent_id: p.parent_id,
          });
          return false;
        }
        return changed;
      })
      .map((p) => ({ id: p.id, order_index: p.order_index, parent_id: p.parent_id }));
    if (updates.length === 0) return;
    reorderPagesMutation.mutate(updates, {
      onError: (e: unknown) => {
        queryClient.setQueryData<Page[]>(workspaceKey, previousPages);
        setError(e instanceof Error ? e.message : "Failed to reorder pages");
      },
    });
  }, [queryClient, reorderPagesMutation, workspaceKey]);

  const tree = buildPageTree(pages);
  const loading = isLoading;
  const displayError = error ?? (queryError instanceof Error ? queryError.message : null);

  return (
    <WorkspaceContext.Provider value={{ pages, tree, activePageId, setActivePageId, createPage, updatePage, deletePage, reorderPagesOpt, loading, error: displayError }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
