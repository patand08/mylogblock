import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Page } from "@/types";

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
vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: () => <div data-testid="blocknote-view">Editor</div>,
}));
vi.mock("@blocknote/core", () => ({
  BlockNoteSchema: { create: vi.fn(() => ({})) },
  defaultBlockSpecs: {},
}));
vi.mock("@blocknote/core/extensions", () => ({ SideMenuExtension: {} }));
vi.mock("@blocknote/core/fonts/inter.css", () => ({}));
vi.mock("@blocknote/mantine/style.css", () => ({}));
vi.mock("@mantine/core", () => ({ Menu: { Item: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button> } }));
vi.mock("@/components/ui/EmojiPickerPopover", () => ({
  default: ({ value }: { value: string | null }) => <span>{value ?? "📄"}</span>,
}));
vi.mock("@/lib/storageRepo", () => ({
  uploadCoverImage: vi.fn(),
  uploadBlockImage: vi.fn(),
}));

import EditorPage from "./EditorPage";

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: "p1", workspace_id: "ws1", parent_id: null, title: "My Page",
    icon: null, cover_image_url: null, created_at: "", updated_at: "",
    created_by: "u1", order_index: 0, is_deleted: false, ...overrides,
  };
}

describe("EditorPage", () => {
  const defaultProps = {
    allPages: [] as Page[],
    onNavigate: vi.fn(),
    onUpdatePage: vi.fn(),
  };

  it("renders editor-page container", () => {
    render(<EditorPage page={makePage()} {...defaultProps} />);
    expect(screen.getByTestId("editor-page")).toBeInTheDocument();
  });

  it("renders page header with title", () => {
    render(<EditorPage page={makePage({ title: "Hello" })} {...defaultProps} />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Hello");
  });

  it("renders BlockEditor", () => {
    render(<EditorPage page={makePage()} {...defaultProps} />);
    expect(screen.getByTestId("block-editor")).toBeInTheDocument();
  });

  it("shows last edited timestamp when updated_at is set", () => {
    render(<EditorPage page={makePage({ updated_at: "2026-04-13T10:00:00Z" })} {...defaultProps} />);
    expect(screen.getByTestId("last-edited")).toBeInTheDocument();
  });

  it("does not show timestamp when updated_at is empty", () => {
    render(<EditorPage page={makePage({ updated_at: "" })} {...defaultProps} />);
    expect(screen.queryByTestId("last-edited")).not.toBeInTheDocument();
  });

  it("renders breadcrumbs for nested page", () => {
    const root = makePage({ id: "root", title: "Root", parent_id: null });
    const child = makePage({ id: "child", title: "Child", parent_id: "root" });
    render(
      <EditorPage
        page={child}
        allPages={[root, child]}
        onNavigate={vi.fn()}
        onUpdatePage={vi.fn()}
      />
    );
    expect(screen.getByText("Root")).toBeInTheDocument();
  });
});
