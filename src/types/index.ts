// ─── Page ────────────────────────────────────────────────────────────────────

export interface Page {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  cover_image_url: string | null;
  cover_image_position?: number; // 0–100 vertical %, default 50
  body?: unknown | null; // BlockNote PartialBlock[] stored as JSONB
  slug?: string | null; // custom URL slug, unique across workspace
  created_at: string;
  updated_at: string;
  created_by: string;
  order_index: number;
  is_deleted: boolean;
}

export type CreatePageInput = Pick<Page, "title" | "parent_id"> & {
  icon?: string;
  cover_image_url?: string | null;
};

export type UpdatePageInput = Partial<
  Pick<Page, "title" | "icon" | "cover_image_url" | "cover_image_position" | "body" | "order_index" | "parent_id" | "slug">
>;

