import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("@blocknote/react", () => ({
  useCreateBlockNote: vi.fn(() => ({ document: [] })),
  SideMenuController: () => null,
  SideMenu: () => null,
  DragHandleMenu: ({ children }: any) => <>{children}</>,
  RemoveBlockItem: ({ children }: any) => <>{children}</>,
  useBlockNoteEditor: vi.fn(() => ({})),
  useExtensionState: vi.fn(() => undefined),
  SuggestionMenuController: () => null,
  getDefaultReactSlashMenuItems: vi.fn(() => []),
  createReactBlockSpec: vi.fn(() => vi.fn(() => ({}))),
}));
vi.mock("@blocknote/core/extensions", () => ({ SideMenuExtension: {} }));
vi.mock("@mantine/core", () => ({ Menu: { Item: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button> } }));
vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: () => <div data-testid="blocknote-view">Editor</div>,
}));
vi.mock("@blocknote/core", () => ({
  BlockNoteSchema: { create: vi.fn(() => ({})) },
  defaultBlockSpecs: {},
}));
vi.mock("@blocknote/core/fonts/inter.css", () => ({}));
vi.mock("@blocknote/mantine/style.css", () => ({}));
vi.mock("twemoji", () => ({
  default: { parse: vi.fn() },
}));

// Mock Supabase so context doesn't make real network calls in tests
vi.mock("@/lib/pageRepo", () => ({
  fetchPages: vi.fn().mockResolvedValue([]),
  insertPage: vi.fn().mockImplementation(async (input) => ({
    id: "test-page-id",
    workspace_id: input.workspace_id,
    parent_id: input.parent_id ?? null,
    title: input.title,
    icon: null,
    cover_image_url: null,
    order_index: input.order_index,
    is_deleted: false,
    created_by: "anonymous",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
  patchPage: vi.fn().mockResolvedValue({}),
  softDeletePage: vi.fn().mockResolvedValue(undefined),
  reorderPagesInDb: vi.fn().mockResolvedValue(undefined),
}));

import WorkspacePage from "./WorkspacePage";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { ThemeProvider } from "@/context/ThemeContext";

async function renderApp(initialPath = "/") {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <ThemeProvider>
          <WorkspaceProvider>
            <Routes>
              <Route path="/" element={<WorkspacePage />} />
              <Route path="/page/:pageId" element={<WorkspacePage />} />
            </Routes>
          </WorkspaceProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  });
}

describe("WorkspacePage", () => {
  it("renders workspace container", async () => {
    await renderApp();
    expect(screen.getByTestId("workspace")).toBeInTheDocument();
  });

  it("shows empty state when no page selected", async () => {
    await renderApp();
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("shows sidebar with page list", async () => {
    await renderApp();
    // Now there are 2 page-list elements (sidebar and mobile drawer), so use getAllByTestId
    expect(screen.getAllByTestId("page-list").length).toBeGreaterThanOrEqual(1);
  });

  it("creates a page and shows editor when 'Create first page' clicked", async () => {
    await renderApp();
    fireEvent.click(screen.getByTestId("create-first-page-btn"));
    expect(await screen.findByTestId("editor-page")).toBeInTheDocument();
  });

  it("new page appears in sidebar tree after creation", async () => {
    await renderApp();
    fireEvent.click(screen.getByTestId("create-first-page-btn"));
    const sidebar = screen.getByTestId("sidebar");
    expect(await screen.findAllByRole("treeitem")).toHaveLength(2); // sidebar + mobile drawer
    const sidebarTreeItem = within(sidebar).getByRole("treeitem");
    expect(sidebarTreeItem).toBeInTheDocument();
  });

  it("empty state disappears after creating a page", async () => {
    await renderApp();
    fireEvent.click(screen.getByTestId("create-first-page-btn"));
    await screen.findByTestId("editor-page");
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("collapses sidebar when toggle clicked", async () => {
    await renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    // Sidebar title span should be hidden when collapsed (EmptyState h2 may still say LogBlock)
    expect(screen.queryByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("clicking New page in sidebar creates page and shows editor", async () => {
    await renderApp();
    const sidebar = screen.getByTestId("sidebar");
    const newPageBtn = within(sidebar).getByTestId("new-page-btn");
    fireEvent.click(newPageBtn);
    expect(await screen.findByTestId("editor-page")).toBeInTheDocument();
  });

  it("deleting active page shows confirm modal, then returns to empty state", async () => {
    await renderApp();
    fireEvent.click(screen.getByTestId("create-first-page-btn"));
    await screen.findByTestId("editor-page");
    const sidebar = screen.getByTestId("sidebar");
    const treeItem = within(sidebar).getByRole("treeitem");
    fireEvent.mouseEnter(treeItem);
    const deleteButtons = screen.getAllByRole("button", { name: "Delete page" });
    fireEvent.click(deleteButtons[0]); // Click the one in sidebar
    // Confirm modal appears
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    // Click confirm
    fireEvent.click(screen.getByTestId("confirm-btn"));
    expect(await screen.findByTestId("empty-state")).toBeInTheDocument();
  });

  it("cancel delete modal does not delete page", async () => {
    await renderApp();
    fireEvent.click(screen.getByTestId("create-first-page-btn"));
    await screen.findByTestId("editor-page");
    const sidebar = screen.getByTestId("sidebar");
    const treeItem = within(sidebar).getByRole("treeitem");
    fireEvent.mouseEnter(treeItem);
    const deleteButtons = screen.getAllByRole("button", { name: "Delete page" });
    fireEvent.click(deleteButtons[0]); // Click the one in sidebar
    fireEvent.click(screen.getByTestId("cancel-btn"));
    // Modal gone, editor still showing
    expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("editor-page")).toBeInTheDocument();
  });

});
