import { describe, it, expect } from "vitest";
import { reorderPages } from "./drag-utils";
import { Page } from "@/types";

function makePage(id: string, parentId: string | null, orderIndex: number): Page {
  return {
    id, workspace_id: "ws1", parent_id: parentId, title: id,
    icon: null, cover_image_url: null, created_at: "", updated_at: "",
    created_by: "u1", order_index: orderIndex, is_deleted: false,
  };
}

describe("reorderPages", () => {
  it("returns same pages when activeId === overId", () => {
    const pages = [makePage("a", null, 0), makePage("b", null, 1)];
    expect(reorderPages(pages, "a", "a")).toEqual(pages);
  });

  it("reorders siblings correctly (a before b → b before a)", () => {
    const pages = [makePage("a", null, 0), makePage("b", null, 1), makePage("c", null, 2)];
    const result = reorderPages(pages, "a", "c");
    const sorted = result.sort((x, y) => x.order_index - y.order_index);
    expect(sorted.map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("does not reorder when pages have different parents", () => {
    const pages = [makePage("a", null, 0), makePage("b", "other", 0)];
    const result = reorderPages(pages, "a", "b");
    expect(result).toEqual(pages);
  });

  it("returns same pages when active not found", () => {
    const pages = [makePage("a", null, 0)];
    expect(reorderPages(pages, "x", "a")).toEqual(pages);
  });

  it("assigns sequential order_index after reorder", () => {
    const pages = [makePage("a", null, 0), makePage("b", null, 1), makePage("c", null, 2)];
    const result = reorderPages(pages, "c", "a");
    const sorted = result.sort((x, y) => x.order_index - y.order_index);
    expect(sorted.map((p) => p.order_index)).toEqual([0, 1, 2]);
  });
});
