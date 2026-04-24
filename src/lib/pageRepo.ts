import { supabase } from "./supabase";
import { Page, CreatePageInput, UpdatePageInput } from "@/types";

export async function fetchPages(workspaceId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_deleted", false)
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Page[];
}

export async function insertPage(input: CreatePageInput & { workspace_id: string; order_index: number; cover_image_url?: string | null }): Promise<Page> {
  const { data, error } = await supabase
    .from("pages")
    .insert({
      workspace_id: input.workspace_id,
      parent_id: input.parent_id ?? null,
      title: input.title,
      icon: input.icon ?? null,
      cover_image_url: input.cover_image_url ?? null,
      cover_image_position: 50,
      order_index: input.order_index,
      created_by: "anonymous",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Page;
}

export async function patchPage(id: string, updates: UpdatePageInput): Promise<Page> {
  const { data, error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Page;
}

export async function softDeletePage(id: string): Promise<void> {
  const { error } = await supabase
    .from("pages")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function fetchPageBySlug(slug: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", slug)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as { id: string } | null;
}

export async function checkSlugAvailable(slug: string, excludePageId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", slug)
    .eq("is_deleted", false)
    .neq("id", excludePageId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data === null; // null means no conflict found
}

export async function setPageSlug(pageId: string, slug: string | null): Promise<void> {
  const { error } = await supabase
    .from("pages")
    .update({ slug: slug ?? null })
    .eq("id", pageId);

  if (error) throw new Error(error.message);
}

export async function reorderPagesInDb(pages: Array<{ id: string; order_index: number; parent_id: string | null }>): Promise<void> {
  for (const p of pages) {
    const { error } = await supabase
      .from("pages")
      .update({ order_index: p.order_index, parent_id: p.parent_id })
      .eq("id", p.id);
    if (error) throw new Error(error.message);
  }
}
