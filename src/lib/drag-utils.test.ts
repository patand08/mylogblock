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

  it("reorders siblings by inserting before over target", () => {
    const pages = [makePage("a", null, 0), makePage("b", null, 1), makePage("c", null, 2)];
    const result = reorderPages(pages, "a", "c");
    const sorted = result.sort((x, y) => x.order_index - y.order_index);
    expect(sorted.map((p) => p.id)).toEqual(["b", "a", "c"]);
  });

  it("moves page across parents as sibling of over target", () => {
    const pages = [
      makePage("a", null, 0),
      makePage("b", "other", 0),
      makePage("c", "other", 1),
    ];
    const result = reorderPages(pages, "a", "b");
    const moved = result.find((p) => p.id === "a")!;
    const siblingOrder = result
      .filter((p) => p.parent_id === "other")
      .sort((x, y) => x.order_index - y.order_index)
      .map((p) => p.id);
    expect(moved.parent_id).toBe("other");
    expect(siblingOrder).toEqual(["a", "b", "c"]);
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

  it("nests active page into over page when dragging right", () => {
    const pages = [
      makePage("skills", null, 0),
      makePage("experience", null, 1),
      makePage("lang", null, 2),
    ];
    const result = reorderPages(pages, "experience", "skills", 40);
    const moved = result.find((p) => p.id === "experience")!;
    expect(moved.parent_id).toBe("skills");
  });

  it("outdents active page one level when dragging left", () => {
    const pages = [
      makePage("root", null, 0),
      makePage("child-a", "root", 0),
      makePage("child-b", "root", 1),
    ];
    const result = reorderPages(pages, "child-a", "child-b", -40);
    const moved = result.find((p) => p.id === "child-a")!;
    expect(moved.parent_id).toBeNull();
  });

  it("prevents creating a cycle when dropping parent onto descendant", () => {
    const pages = [
      makePage("root", null, 0),
      makePage("child", "root", 0),
      makePage("grandchild", "child", 0),
    ];
    const result = reorderPages(pages, "root", "grandchild", 0);
    expect(result).toEqual(pages);
  });
});
