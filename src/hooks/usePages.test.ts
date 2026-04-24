import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { usePages } from "./usePages";

describe("usePages", () => {
  it("initialises with empty pages", () => {
    const { result } = renderHook(() => usePages("ws-1"));
    expect(result.current.pages).toHaveLength(0);
    expect(result.current.tree).toHaveLength(0);
  });

  it("creates a root page", () => {
    const { result } = renderHook(() => usePages("ws-1"));
    act(() => { result.current.createPage({ title: "Hello", parent_id: null }); });
    expect(result.current.pages).toHaveLength(1);
    expect(result.current.pages[0].title).toBe("Hello");
  });

  it("creates a child page", () => {
    const { result } = renderHook(() => usePages("ws-1"));
    let parentId: string;
    act(() => {
      const p = result.current.createPage({ title: "Parent", parent_id: null });
      parentId = p.id;
    });
    act(() => {
      result.current.createPage({ title: "Child", parent_id: parentId! });
    });
    const child = result.current.pages.find((p) => p.title === "Child");
    expect(child?.parent_id).toBe(parentId!);
  });

  it("builds page tree from flat list", () => {
    const { result } = renderHook(() => usePages("ws-1"));
    let parentId: string;
    act(() => {
      const p = result.current.createPage({ title: "Parent", parent_id: null });
      parentId = p.id;
    });
    act(() => { result.current.createPage({ title: "Child", parent_id: parentId! }); });
    expect(result.current.tree).toHaveLength(1);
    expect(result.current.tree[0].children).toHaveLength(1);
  });

  it("renames a page via updatePage", () => {
    const { result } = renderHook(() => usePages("ws-1"));
    let id: string;
    act(() => { id = result.current.createPage({ title: "Old", parent_id: null }).id; });
    act(() => { result.current.updatePage(id!, { title: "New" }); });
    expect(result.current.pages.find((p) => p.id === id!)?.title).toBe("New");
  });

  it("soft-deletes a page", () => {
    const { result } = renderHook(() => usePages("ws-1"));
    let id: string;
    act(() => { id = result.current.createPage({ title: "Gone", parent_id: null }).id; });
    act(() => { result.current.deletePage(id!); });
    expect(result.current.pages.find((p) => p.id === id!)?.is_deleted).toBe(true);
    expect(result.current.tree).toHaveLength(0); // excluded from tree
  });

  it("assigns sequential order_index to siblings", () => {
    const { result } = renderHook(() => usePages("ws-1"));
    act(() => { result.current.createPage({ title: "A", parent_id: null }); });
    act(() => { result.current.createPage({ title: "B", parent_id: null }); });
    const root = result.current.pages.filter((p) => !p.is_deleted);
    const indices = root.map((p) => p.order_index).sort();
    expect(indices).toEqual([0, 1]);
  });

  it("initialises with provided pages", () => {
    const existing = [{
      id: "x", workspace_id: "ws-1", parent_id: null, title: "Existing",
      icon: null, cover_image_url: null, created_at: "", updated_at: "",
      created_by: "u", order_index: 0, is_deleted: false,
    }];
    const { result } = renderHook(() => usePages("ws-1", existing));
    expect(result.current.pages).toHaveLength(1);
  });
});
