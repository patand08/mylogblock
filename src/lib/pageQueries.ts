import { useMutation, useQuery } from "@tanstack/react-query";
import {
  checkSlugAvailable,
  fetchPageBySlug,
  fetchPages,
  insertPage,
  patchPage,
  reorderPagesInDb,
  setPageSlug,
  softDeletePage,
} from "@/lib/pageRepo";
import { uploadBlockImage, uploadCoverImage } from "@/lib/storageRepo";
import { CreatePageInput, UpdatePageInput } from "@/types";

export const pageKeys = {
  all: ["pages"] as const,
  workspace: (workspaceId: string) => ["pages", workspaceId] as const,
  bySlug: (slug: string) => ["pageBySlug", slug] as const,
  slugAvailability: (slug: string, excludePageId: string) =>
    ["slugAvailable", slug, excludePageId] as const,
};

export function useWorkspacePagesQuery(workspaceId: string) {
  return useQuery({
    queryKey: pageKeys.workspace(workspaceId),
    queryFn: () => fetchPages(workspaceId),
  });
}

export function usePageBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: pageKeys.bySlug(slug ?? ""),
    queryFn: () => fetchPageBySlug(slug ?? ""),
    enabled: Boolean(slug),
  });
}

export function useCreatePageMutation() {
  return useMutation({
    mutationFn: (input: CreatePageInput & {
      workspace_id: string;
      order_index: number;
      cover_image_url?: string | null;
    }) => insertPage(input),
  });
}

export function useUpdatePageMutation() {
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePageInput }) =>
      patchPage(id, updates),
  });
}

export function useDeletePageMutation() {
  return useMutation({
    mutationFn: (id: string) => softDeletePage(id),
  });
}

export function useReorderPagesMutation() {
  return useMutation({
    mutationFn: (updates: Array<{ id: string; order_index: number; parent_id: string | null }>) =>
      reorderPagesInDb(updates),
  });
}

export function useSetPageSlugMutation() {
  return useMutation({
    mutationFn: ({ pageId, slug }: { pageId: string; slug: string | null }) =>
      setPageSlug(pageId, slug),
  });
}

export function useCheckSlugAvailabilityQuery(slug: string, excludePageId: string) {
  return useQuery({
    queryKey: pageKeys.slugAvailability(slug, excludePageId),
    queryFn: () => checkSlugAvailable(slug, excludePageId),
    enabled: slug.length >= 2,
  });
}

export function useUploadCoverImageMutation() {
  return useMutation({
    mutationFn: ({ pageId, file }: { pageId: string; file: File }) =>
      uploadCoverImage(pageId, file),
  });
}

export function useUploadBlockImageMutation() {
  return useMutation({
    mutationFn: ({ blockId, file }: { blockId: string; file: File }) =>
      uploadBlockImage(blockId, file),
  });
}
