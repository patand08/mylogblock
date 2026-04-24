export interface Page {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  cover_image_url: string | null;
  cover_image_position: number;
  body: unknown | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  order_index: number;
  is_deleted: boolean;
}

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};
