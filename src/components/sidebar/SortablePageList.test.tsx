import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SortablePageList from "./SortablePageList";
import { PageTreeNode } from "@/lib/page-utils";
import { Page } from "@/types";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}));
vi.mock("./SortablePageItem", () => ({
  default: ({ node }: any) => <div role="treeitem">{node.page.title}</div>,
}));

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: "p1", workspace_id: "ws1", parent_id: null, title: "Page",
    icon: null, cover_image_url: null, created_at: "", updated_at: "",
    created_by: "u1", order_index: 0, is_deleted: false, ...overrides,
  };
}

const defaultProps = {
  activePageId: null,
  onSelect: vi.fn(),
  onCreatePage: vi.fn(),
  onDeletePage: vi.fn(),
  onRenamePage: vi.fn(),
  onReorderPages: vi.fn(),
};

describe("SortablePageList search", () => {
  it("renders search input", () => {
    render(<SortablePageList tree={[]} {...defaultProps} />);
    expect(screen.getByTestId("page-search")).toBeInTheDocument();
  });

  it("shows all pages when search is empty", () => {
    const tree: PageTreeNode[] = [
      { page: makePage({ id: "p1", title: "Alpha" }), children: [] },
      { page: makePage({ id: "p2", title: "Beta" }), children: [] },
    ];
    render(<SortablePageList tree={tree} {...defaultProps} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("filters pages by search term", () => {
    const tree: PageTreeNode[] = [
      { page: makePage({ id: "p1", title: "Alpha" }), children: [] },
      { page: makePage({ id: "p2", title: "Beta" }), children: [] },
    ];
    render(<SortablePageList tree={tree} {...defaultProps} />);
    fireEvent.change(screen.getByTestId("page-search"), { target: { value: "Alp" } });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("search is case-insensitive", () => {
    const tree: PageTreeNode[] = [
      { page: makePage({ id: "p1", title: "Alpha" }), children: [] },
    ];
    render(<SortablePageList tree={tree} {...defaultProps} />);
    fireEvent.change(screen.getByTestId("page-search"), { target: { value: "alpha" } });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("shows no-results message when no match", () => {
    const tree: PageTreeNode[] = [
      { page: makePage({ id: "p1", title: "Alpha" }), children: [] },
    ];
    render(<SortablePageList tree={tree} {...defaultProps} />);
    fireEvent.change(screen.getByTestId("page-search"), { target: { value: "zzz" } });
    expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
  });
});
