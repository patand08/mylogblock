import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PageTreeItem from "./PageTreeItem";
import { PageTreeNode } from "@/lib/page-utils";
import { Page } from "@/types";

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  })),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: "p1", workspace_id: "ws1", parent_id: null, title: "Test Page",
    icon: null, cover_image_url: null, created_at: "", updated_at: "",
    created_by: "u1", order_index: 0, is_deleted: false, ...overrides,
  };
}

function makeNode(page: Page, children: PageTreeNode[] = []): PageTreeNode {
  return { page, children };
}

const noop = vi.fn();
const defaultProps = {
  activePageId: null,
  onSelect: noop,
  onCreateChild: noop,
  onDelete: noop,
  onRename: noop,
};

describe("PageTreeItem", () => {
  it("renders page title", () => {
    render(<PageTreeItem node={makeNode(makePage({ title: "My Page" }))} {...defaultProps} />);
    expect(screen.getByText("My Page")).toBeInTheDocument();
  });

  it("renders default icon when no icon set", () => {
    render(<PageTreeItem node={makeNode(makePage({ icon: null }))} {...defaultProps} />);
    expect(screen.getByText("📄")).toBeInTheDocument();
  });

  it("renders custom icon", () => {
    render(<PageTreeItem node={makeNode(makePage({ icon: "🚀" }))} {...defaultProps} />);
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("calls onSelect when row clicked", () => {
    const onSelect = vi.fn();
    const page = makePage();
    render(<PageTreeItem node={makeNode(page)} {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("page-item-p1"));
    expect(onSelect).toHaveBeenCalledWith(page);
  });

  it("marks active page with aria-selected", () => {
    const page = makePage({ id: "p1" });
    render(<PageTreeItem node={makeNode(page)} {...defaultProps} activePageId="p1" />);
    expect(screen.getByRole("treeitem")).toHaveAttribute("aria-selected", "true");
  });

  it("renders children when present", () => {
    const parent = makePage({ id: "parent", title: "Parent" });
    const child = makePage({ id: "child", title: "Child", parent_id: "parent" });
    const node = makeNode(parent, [makeNode(child)]);
    render(<PageTreeItem node={node} {...defaultProps} />);
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("hides children when collapsed", () => {
    const parent = makePage({ id: "parent" });
    const child = makePage({ id: "child", title: "Hidden Child" });
    const node = makeNode(parent, [makeNode(child)]);
    render(<PageTreeItem node={node} {...defaultProps} />);
    fireEvent.click(screen.getByTestId("toggle-parent"));
    expect(screen.queryByText("Hidden Child")).not.toBeInTheDocument();
  });

  it("calls onCreateChild on add button click", () => {
    const onCreateChild = vi.fn();
    const page = makePage({ id: "p1" });
    render(<PageTreeItem node={makeNode(page)} {...defaultProps} onCreateChild={onCreateChild} />);
    fireEvent.mouseEnter(screen.getByTestId("page-item-p1"));
    fireEvent.click(screen.getByTestId("add-child-p1"));
    expect(onCreateChild).toHaveBeenCalledWith("p1");
  });

  it("calls onDelete on delete button click", () => {
    const onDelete = vi.fn();
    const page = makePage({ id: "p1" });
    render(<PageTreeItem node={makeNode(page)} {...defaultProps} onDelete={onDelete} />);
    fireEvent.mouseEnter(screen.getByTestId("page-item-p1"));
    fireEvent.click(screen.getByTestId("delete-p1"));
    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("shows rename input on double click", () => {
    const page = makePage({ id: "p1", title: "Original" });
    render(<PageTreeItem node={makeNode(page)} {...defaultProps} />);
    fireEvent.dblClick(screen.getByText("Original"));
    expect(screen.getByTestId("rename-input-p1")).toBeInTheDocument();
  });

  it("calls onRename when rename committed with Enter", () => {
    const onRename = vi.fn();
    const page = makePage({ id: "p1", title: "Old Title" });
    render(<PageTreeItem node={makeNode(page)} {...defaultProps} onRename={onRename} />);
    fireEvent.dblClick(screen.getByText("Old Title"));
    const input = screen.getByTestId("rename-input-p1");
    fireEvent.change(input, { target: { value: "New Title" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRename).toHaveBeenCalledWith("p1", "New Title");
  });
});
