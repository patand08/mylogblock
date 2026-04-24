import { describe, it, expect } from "vitest";
import {
  createPageObject,
  applyPageUpdate,
  softDeletePage,
  buildPageTree,
  getPageBreadcrumbs,
} from "./page-utils";
import type { Page } from "@/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: "page-1",
    workspace_id: "ws-1",
    parent_id: null,
    title: "My Page",
    icon: null,
    cover_image_url: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    created_by: "user-1",
    order_index: 0,
    is_deleted: false,
    ...overrides,
  };
}

// ─── createPageObject ────────────────────────────────────────────────────────

describe("createPageObject", () => {
  it("creates a page with required fields", () => {
    const page = createPageObject(
      { title: "Hello", parent_id: null },
      "ws-1",
      0,
      "p-1"
    );
    expect(page.id).toBe("p-1");
    expect(page.title).toBe("Hello");
    expect(page.workspace_id).toBe("ws-1");
    expect(page.parent_id).toBeNull();
    expect(page.is_deleted).toBe(false);
  });

  it("trims whitespace from title", () => {
    const page = createPageObject(
      { title: "  Spaced  ", parent_id: null },
      "ws-1",
      0,
      "p-2"
    );
    expect(page.title).toBe("Spaced");
  });

  it("defaults empty title to 'Untitled'", () => {
    const page = createPageObject(
      { title: "   ", parent_id: null },
      "ws-1",
      0,
      "p-3"
    );
    expect(page.title).toBe("Untitled");
  });

  it("sets parent_id when provided", () => {
    const page = createPageObject(
      { title: "Child", parent_id: "parent-1" },
      "ws-1",
      0,
      "p-4"
    );
    expect(page.parent_id).toBe("parent-1");
  });

  it("initialises cover_image_url as null", () => {
    const page = createPageObject(
      { title: "X", parent_id: null },
      "ws-1",
      0,
      "p-5"
    );
    expect(page.cover_image_url).toBeNull();
  });
});

// ─── applyPageUpdate ─────────────────────────────────────────────────────────

describe("applyPageUpdate", () => {
  it("updates the title", () => {
    const page = makePage({ title: "Old" });
    const updated = applyPageUpdate(page, { title: "New" });
    expect(updated.title).toBe("New");
  });

  it("does not mutate original page", () => {
    const page = makePage({ title: "Original" });
    applyPageUpdate(page, { title: "Changed" });
    expect(page.title).toBe("Original");
  });

  it("defaults empty title update to 'Untitled'", () => {
    const page = makePage({ title: "Has Title" });
    const updated = applyPageUpdate(page, { title: "" });
    expect(updated.title).toBe("Untitled");
  });

  it("updates updated_at timestamp", () => {
    const page = makePage({ updated_at: "2020-01-01T00:00:00.000Z" });
    const updated = applyPageUpdate(page, { title: "New" });
    expect(updated.updated_at).not.toBe("2020-01-01T00:00:00.000Z");
  });

  it("keeps other fields unchanged", () => {
    const page = makePage({ icon: "📄", cover_image_url: "https://img.url" });
    const updated = applyPageUpdate(page, { title: "New Title" });
    expect(updated.icon).toBe("📄");
    expect(updated.cover_image_url).toBe("https://img.url");
  });
});

// ─── softDeletePage ───────────────────────────────────────────────────────────

describe("softDeletePage", () => {
  it("marks page as deleted", () => {
    const page = makePage({ is_deleted: false });
    const deleted = softDeletePage(page);
    expect(deleted.is_deleted).toBe(true);
  });

  it("does not mutate the original", () => {
    const page = makePage({ is_deleted: false });
    softDeletePage(page);
    expect(page.is_deleted).toBe(false);
  });
});

// ─── buildPageTree ─────────────────────────────────────────────────────────────

describe("buildPageTree", () => {
  it("returns empty tree for empty list", () => {
    expect(buildPageTree([])).toEqual([]);
  });

  it("returns root pages with no parent_id", () => {
    const pages = [makePage({ id: "a", parent_id: null, order_index: 0 })];
    const tree = buildPageTree(pages);
    expect(tree).toHaveLength(1);
    expect(tree[0].page.id).toBe("a");
    expect(tree[0].children).toHaveLength(0);
  });

  it("nests children under parent", () => {
    const pages = [
      makePage({ id: "parent", parent_id: null, order_index: 0 }),
      makePage({ id: "child", parent_id: "parent", order_index: 0 }),
    ];
    const tree = buildPageTree(pages);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].page.id).toBe("child");
  });

  it("sorts pages by order_index", () => {
    const pages = [
      makePage({ id: "b", parent_id: null, order_index: 1 }),
      makePage({ id: "a", parent_id: null, order_index: 0 }),
    ];
    const tree = buildPageTree(pages);
    expect(tree[0].page.id).toBe("a");
    expect(tree[1].page.id).toBe("b");
  });

  it("excludes deleted pages", () => {
    const pages = [
      makePage({ id: "a", parent_id: null, is_deleted: false }),
      makePage({ id: "b", parent_id: null, is_deleted: true }),
    ];
    const tree = buildPageTree(pages);
    expect(tree).toHaveLength(1);
    expect(tree[0].page.id).toBe("a");
  });
});

// ─── getPageBreadcrumbs ───────────────────────────────────────────────────────

describe("getPageBreadcrumbs", () => {
  it("returns single page for a root page", () => {
    const pages = [makePage({ id: "root", parent_id: null })];
    expect(getPageBreadcrumbs(pages, "root")).toHaveLength(1);
  });

  it("returns path from root to nested page", () => {
    const pages = [
      makePage({ id: "root", parent_id: null }),
      makePage({ id: "child", parent_id: "root" }),
      makePage({ id: "grandchild", parent_id: "child" }),
    ];
    const crumbs = getPageBreadcrumbs(pages, "grandchild");
    expect(crumbs.map((p) => p.id)).toEqual(["root", "child", "grandchild"]);
  });

  it("returns empty array for unknown page id", () => {
    const pages = [makePage({ id: "a", parent_id: null })];
    expect(getPageBreadcrumbs(pages, "unknown")).toHaveLength(0);
  });
});
