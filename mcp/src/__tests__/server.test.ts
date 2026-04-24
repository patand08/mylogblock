import { describe, it, expect, vi } from "vitest";
import {
  handleListPages,
  handleGetPage,
  handleCreatePage,
  handleUpdatePage,
  handleDeletePage,
  handleSearchPages,
  handleSetPageSlug,
  handleGetPageBySlug,
} from "../server.js";

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// Supabase QueryBuilder is a Promise-like (thenable) that also supports method
// chaining. We model that here: every chaining method returns `this`, terminal
// methods (single, maybeSingle, order) return Promises, and `then` makes the
// query itself directly awaitable.

function makeQuery(resolved: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {
    // Chaining methods — all return `this`
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    // Terminal methods
    order: vi.fn().mockResolvedValue(resolved),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
  };
  // Make query directly awaitable (resolves to `resolved`)
  q.then = (onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(onFulfilled);
  return q;
}

function makeSupabase(data: unknown = null, error: unknown = null) {
  const q = makeQuery({ data, error });
  return { from: vi.fn().mockReturnValue(q), _q: q };
}

const WORKSPACE = "test-workspace";

// ─── list_pages ───────────────────────────────────────────────────────────────

describe("handleListPages", () => {
  it("returns page summaries including slug", async () => {
    const pages = [
      { id: "1", title: "Page One", icon: "📄", parent_id: null, slug: "my-page", order_index: 0, updated_at: "2024-01-01" },
    ];
    const sb = makeSupabase(pages);
    const result = await handleListPages(sb as never, WORKSPACE);
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("Page One");
    expect(parsed[0].slug).toBe("my-page");
  });

  it("throws when supabase fails", async () => {
    const sb = makeSupabase(null, { message: "DB error" });
    await expect(handleListPages(sb as never, WORKSPACE)).rejects.toThrow("DB error");
  });
});

// ─── get_page ─────────────────────────────────────────────────────────────────

describe("handleGetPage", () => {
  it("returns the page when found", async () => {
    const page = { id: "abc", title: "Found", slug: "found-slug" };
    const sb = makeSupabase(page);
    const result = await handleGetPage(sb as never, "abc");
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.title).toBe("Found");
    expect(parsed.slug).toBe("found-slug");
  });

  it("returns isError when not found", async () => {
    const sb = makeSupabase(null, { message: "not found" });
    const result = await handleGetPage(sb as never, "missing");
    expect(result.isError).toBe(true);
  });
});

// ─── create_page ──────────────────────────────────────────────────────────────

describe("handleCreatePage", () => {
  it("creates a top-level page", async () => {
    const newPage = { id: "new", title: "New Page" };
    // First call to from() = getPages (order terminal), second = insert (single terminal)
    let callCount = 0;
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeQuery({ data: [], error: null }); // getPages
        return makeQuery({ data: newPage, error: null }); // insert
      }),
    };
    const result = await handleCreatePage(sb as never, WORKSPACE, { title: "New Page" });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.title).toBe("New Page");
  });

  it("returns isError when insert fails", async () => {
    let callCount = 0;
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeQuery({ data: [], error: null }); // getPages
        return makeQuery({ data: null, error: { message: "insert failed" } }); // insert
      }),
    };
    const result = await handleCreatePage(sb as never, WORKSPACE, { title: "Bad" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("insert failed");
  });
});

// ─── update_page ──────────────────────────────────────────────────────────────

describe("handleUpdatePage", () => {
  it("returns isError when no fields provided", async () => {
    const sb = makeSupabase();
    const result = await handleUpdatePage(sb as never, "id-1", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("No fields");
  });

  it("updates title", async () => {
    const updated = { id: "id-1", title: "New Title" };
    const sb = makeSupabase(updated);
    const result = await handleUpdatePage(sb as never, "id-1", { title: "New Title" });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(result.content[0].text).title).toBe("New Title");
  });

  it("can update slug to a new value", async () => {
    const updated = { id: "id-1", slug: "new-slug" };
    const sb = makeSupabase(updated);
    const result = await handleUpdatePage(sb as never, "id-1", { slug: "new-slug" });
    expect(result.isError).toBeFalsy();
  });

  it("can clear slug by passing null", async () => {
    const updated = { id: "id-1", slug: null };
    const sb = makeSupabase(updated);
    const result = await handleUpdatePage(sb as never, "id-1", { slug: null });
    expect(result.isError).toBeFalsy();
  });
});

// ─── delete_page ──────────────────────────────────────────────────────────────

describe("handleDeletePage", () => {
  it("soft-deletes the page with no children", async () => {
    // First from() call = update (awaitable directly), second = select children (order terminal)
    let callCount = 0;
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeQuery({ data: null, error: null }); // update
        return makeQuery({ data: [], error: null }); // select children
      }),
    };
    const result = await handleDeletePage(sb as never, "page-1", true);
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("Deleted 1");
  });

  it("returns isError when delete fails", async () => {
    const sb = { from: vi.fn().mockReturnValue(makeQuery({ data: null, error: { message: "no permission" } })) };
    const result = await handleDeletePage(sb as never, "page-1", false);
    expect(result.isError).toBe(true);
  });
});

// ─── search_pages ─────────────────────────────────────────────────────────────

describe("handleSearchPages", () => {
  it("returns matching pages", async () => {
    const pages = [{ id: "1", title: "Meeting Notes", slug: null }];
    const sb = makeSupabase(pages);
    const result = await handleSearchPages(sb as never, WORKSPACE, "meeting");
    expect(JSON.parse(result.content[0].text)[0].title).toBe("Meeting Notes");
  });

  it("returns isError on DB failure", async () => {
    const sb = makeSupabase(null, { message: "search failed" });
    const result = await handleSearchPages(sb as never, WORKSPACE, "test");
    expect(result.isError).toBe(true);
  });
});

// ─── set_page_slug ────────────────────────────────────────────────────────────

describe("handleSetPageSlug", () => {
  it("returns isError for invalid slug format", async () => {
    const sb = makeSupabase();
    const result = await handleSetPageSlug(sb as never, "page-1", "Invalid Slug!");
    expect(result.isError).toBe(true);
  });

  it("returns isError for reserved slug 'api'", async () => {
    const result = await handleSetPageSlug(makeSupabase() as never, "page-1", "api");
    expect(result.isError).toBe(true);
  });

  it("returns isError when slug is already taken", async () => {
    // availability check returns a conflicting page
    const q = makeQuery({ data: { id: "other-page" }, error: null });
    q.maybeSingle = vi.fn().mockResolvedValue({ data: { id: "other-page" }, error: null });
    const sb = { from: vi.fn().mockReturnValue(q) };
    const result = await handleSetPageSlug(sb as never, "page-1", "taken-slug");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("taken");
  });

  it("sets the slug when available", async () => {
    let callCount = 0;
    const sb = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // availability check → not taken
          const q = makeQuery({ data: null, error: null });
          q.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
          return q;
        }
        // slug update
        return makeQuery({ data: null, error: null });
      }),
    };
    const result = await handleSetPageSlug(sb as never, "page-1", "new-slug");
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("new-slug");
  });

  it("clears slug when empty string passed", async () => {
    const sb = { from: vi.fn().mockReturnValue(makeQuery({ data: null, error: null })) };
    const result = await handleSetPageSlug(sb as never, "page-1", "");
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("cleared");
  });
});

// ─── get_page_by_slug ─────────────────────────────────────────────────────────

describe("handleGetPageBySlug", () => {
  it("returns the page when slug exists", async () => {
    const page = { id: "abc", title: "Found", slug: "my-slug" };
    const q = makeQuery({ data: page, error: null });
    q.maybeSingle = vi.fn().mockResolvedValue({ data: page, error: null });
    const sb = { from: vi.fn().mockReturnValue(q) };
    const result = await handleGetPageBySlug(sb as never, "my-slug");
    expect(JSON.parse(result.content[0].text).slug).toBe("my-slug");
  });

  it("returns isError when slug not found", async () => {
    const q = makeQuery({ data: null, error: null });
    q.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const sb = { from: vi.fn().mockReturnValue(q) };
    const result = await handleGetPageBySlug(sb as never, "nonexistent");
    expect(result.isError).toBe(true);
  });
});
