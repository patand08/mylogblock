import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { validateSlug } from "./validation.js";
import type { Page, ToolResult } from "./types.js";

// ─── Supabase type (thin interface so we can mock it in tests) ────────────────

type SupabaseQuery = {
  select: (cols?: string) => SupabaseQuery;
  insert: (data: unknown) => SupabaseQuery;
  update: (data: unknown) => SupabaseQuery;
  eq: (col: string, val: unknown) => SupabaseQuery;
  neq: (col: string, val: unknown) => SupabaseQuery;
  ilike: (col: string, val: string) => SupabaseQuery;
  order: (col: string, opts?: object) => Promise<{ data: unknown; error: { message: string } | null }>;
  single: () => Promise<{ data: unknown; error: { message: string } | null }>;
  maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
};

export type SupabaseClient = {
  from: (table: string) => SupabaseQuery;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPages(supabase: SupabaseClient, workspaceId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_deleted", false)
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Page[];
}

function buildTree(pages: Page[]): unknown {
  const map = new Map<string, Page & { children: unknown[] }>();
  for (const p of pages) map.set(p.id, { ...p, children: [] });
  const roots: unknown[] = [];
  for (const p of map.values()) {
    if (p.parent_id && map.has(p.parent_id)) {
      map.get(p.parent_id)!.children.push(p);
    } else {
      roots.push(p);
    }
  }
  return roots;
}

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: "text", text: msg }], isError: true };
}

// ─── Exported handlers (testable without MCP protocol) ───────────────────────

export async function handleListPages(supabase: SupabaseClient, workspaceId: string): Promise<ToolResult> {
  const pages = await getPages(supabase, workspaceId);
  return ok(pages.map((p) => ({
    id: p.id, title: p.title, icon: p.icon, parent_id: p.parent_id,
    slug: p.slug, order_index: p.order_index, updated_at: p.updated_at,
  })));
}

export async function handleGetPageTree(supabase: SupabaseClient, workspaceId: string): Promise<ToolResult> {
  const pages = await getPages(supabase, workspaceId);
  return ok(buildTree(pages));
}

export async function handleGetPage(supabase: SupabaseClient, id: string): Promise<ToolResult> {
  const { data, error } = await supabase
    .from("pages").select("*").eq("id", id).eq("is_deleted", false).single();
  if (error) return err(`Page not found: ${error.message}`);
  return ok(data);
}

export async function handleCreatePage(
  supabase: SupabaseClient,
  workspaceId: string,
  input: { title: string; parent_id?: string; icon?: string; body?: unknown[] }
): Promise<ToolResult> {
  const pages = await getPages(supabase, workspaceId);
  const siblings = pages.filter((p) => p.parent_id === (input.parent_id ?? null));
  const order_index = siblings.length > 0 ? Math.max(...siblings.map((p) => p.order_index)) + 1 : 0;

  const { data, error } = await supabase
    .from("pages")
    .insert({
      workspace_id: workspaceId,
      parent_id: input.parent_id ?? null,
      title: input.title,
      icon: input.icon ?? null,
      cover_image_url: null,
      cover_image_position: 50,
      body: input.body ?? null,
      order_index,
      created_by: "mcp",
    })
    .select()
    .single();

  if (error) return err(`Failed to create: ${error.message}`);
  return ok(data);
}

export async function handleUpdatePage(
  supabase: SupabaseClient,
  id: string,
  fields: {
    title?: string;
    icon?: string | null;
    body?: unknown[];
    cover_image_url?: string | null;
    cover_image_position?: number;
    slug?: string | null;
  }
): Promise<ToolResult> {
  const updates: Record<string, unknown> = {};
  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.icon !== undefined) updates.icon = fields.icon;
  if (fields.body !== undefined) updates.body = fields.body;
  if (fields.cover_image_url !== undefined) updates.cover_image_url = fields.cover_image_url;
  if (fields.cover_image_position !== undefined) updates.cover_image_position = fields.cover_image_position;
  if (fields.slug !== undefined) updates.slug = fields.slug;

  if (Object.keys(updates).length === 0) return err("No fields provided to update.");

  const { data, error } = await supabase
    .from("pages").update(updates).eq("id", id).select().single();
  if (error) return err(`Failed to update: ${error.message}`);
  return ok(data);
}

export async function handleDeletePage(
  supabase: SupabaseClient,
  id: string,
  deleteChildren: boolean
): Promise<ToolResult> {
  const deleted: string[] = [];

  async function softDelete(pageId: string): Promise<void> {
    const { error } = await supabase.from("pages").update({ is_deleted: true }).eq("id", pageId) as unknown as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    deleted.push(pageId);
    if (deleteChildren) {
      const { data: children } = await supabase
        .from("pages").select("id").eq("parent_id", pageId).eq("is_deleted", false)
        .order("order_index") as unknown as { data: { id: string }[] | null };
      if (children) for (const child of children) await softDelete(child.id);
    }
  }

  try {
    await softDelete(id);
    return ok(`Deleted ${deleted.length} page(s): ${deleted.join(", ")}`);
  } catch (e) {
    return err(`Delete failed: ${(e as Error).message}`);
  }
}

export async function handleSearchPages(
  supabase: SupabaseClient,
  workspaceId: string,
  query: string
): Promise<ToolResult> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, title, icon, parent_id, slug, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("is_deleted", false)
    .ilike("title", `%${query}%`)
    .order("updated_at", { ascending: false });

  if (error) return err(`Search failed: ${error.message}`);
  return ok(data);
}

export async function handleSetPageSlug(
  supabase: SupabaseClient,
  pageId: string,
  slug: string
): Promise<ToolResult> {
  const trimmed = slug.trim();

  // Empty = clear slug
  if (trimmed === "") {
    const { error } = await supabase.from("pages").update({ slug: null }).eq("id", pageId) as unknown as { error: { message: string } | null };
    if (error) return err(`Failed to clear slug: ${error.message}`);
    return ok("Slug cleared successfully");
  }

  // Validate format
  const validationErr = validateSlug(trimmed);
  if (validationErr) return err(`Invalid slug: ${validationErr}`);

  // Check availability
  const { data: conflict, error: checkErr } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", trimmed)
    .eq("is_deleted", false)
    .neq("id", pageId)
    .maybeSingle();

  if (checkErr) return err(`Failed to check slug: ${checkErr.message}`);
  if (conflict) return err(`Slug "${trimmed}" is already taken by another page`);

  // Set slug
  const { error } = await supabase.from("pages").update({ slug: trimmed }).eq("id", pageId) as unknown as { error: { message: string } | null };
  if (error) {
    if (error.message.includes("unique") || error.message.includes("duplicate")) {
      return err(`Slug "${trimmed}" is already taken`);
    }
    return err(`Failed to set slug: ${error.message}`);
  }

  const appUrl = process.env.APP_URL ?? "https://mylogblock.vercel.app";
  return ok({ slug: trimmed, public_url: `${appUrl}/s/${trimmed}`, message: `Slug set to "${trimmed}". Public URL: ${appUrl}/s/${trimmed}` });
}

export async function handleGetPageBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<ToolResult> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) return err(`Failed to look up slug: ${error.message}`);
  if (!data) return err(`No page found with slug "${slug}"`);
  return ok(data);
}

// ─── buildServer ──────────────────────────────────────────────────────────────

export function buildServer(supabase: SupabaseClient, workspaceId: string): McpServer {
  const server = new McpServer({ name: "mylogblock", version: "1.0.0" });

  server.tool("list_pages", "List all pages (flat, ordered). Includes slug field.", {}, () =>
    handleListPages(supabase, workspaceId)
  );

  server.tool("get_page_tree", "Get all pages as a nested tree structure", {}, () =>
    handleGetPageTree(supabase, workspaceId)
  );

  server.tool(
    "get_page",
    "Get a single page by ID, including full body content and slug",
    { id: z.string().describe("Page UUID") },
    ({ id }) => handleGetPage(supabase, id)
  );

  server.tool(
    "create_page",
    "Create a new page in MyLogBlock",
    {
      title: z.string().describe("Page title"),
      parent_id: z.string().optional().describe("Parent page UUID (omit for top-level)"),
      icon: z.string().optional().describe("Emoji icon e.g. 📄"),
      body: z.array(z.unknown()).optional().describe("BlockNote block array"),
    },
    ({ title, parent_id, icon, body }) =>
      handleCreatePage(supabase, workspaceId, { title, parent_id, icon, body: body as unknown[] })
  );

  server.tool(
    "update_page",
    "Update a page's title, icon, body, cover image, or slug",
    {
      id: z.string().describe("Page UUID"),
      title: z.string().optional(),
      icon: z.string().nullable().optional(),
      body: z.array(z.unknown()).optional(),
      cover_image_url: z.string().nullable().optional(),
      cover_image_position: z.number().min(0).max(100).optional(),
      slug: z.string().nullable().optional().describe("Custom URL slug (null to remove)"),
    },
    ({ id, ...fields }) => handleUpdatePage(supabase, id, fields)
  );

  server.tool(
    "delete_page",
    "Soft-delete a page and optionally all its subpages",
    {
      id: z.string().describe("Page UUID"),
      delete_children: z.boolean().default(true).describe("Also delete subpages (default: true)"),
    },
    ({ id, delete_children }) => handleDeletePage(supabase, id, delete_children)
  );

  server.tool(
    "search_pages",
    "Search pages by title keyword",
    { query: z.string().describe("Search term") },
    ({ query }) => handleSearchPages(supabase, workspaceId, query)
  );

  server.tool(
    "set_page_slug",
    "Set or clear the custom URL slug for a page. Empty string clears the slug. Custom slug pages are accessible at /s/{slug} (e.g. https://mylogblock.vercel.app/s/my-page).",
    {
      id: z.string().describe("Page UUID"),
      slug: z.string().describe("New slug (e.g. 'my-page'). Empty string to clear."),
    },
    ({ id, slug }) => handleSetPageSlug(supabase, id, slug)
  );

  server.tool(
    "get_page_by_slug",
    "Find a page by its custom URL slug",
    { slug: z.string().describe("The custom slug to look up") },
    ({ slug }) => handleGetPageBySlug(supabase, slug)
  );

  return server;
}
