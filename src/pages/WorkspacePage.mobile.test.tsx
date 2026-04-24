import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WorkspacePage from "./WorkspacePage";
import { BrowserRouter } from "react-router-dom";

const mockPages = [
  {
    id: "1",
    workspace_id: "ws1",
    title: "Home",
    icon: "🏠",
    body: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: null,
    slug: null,
    cover_image_url: null,
    created_by: "user1",
    order_index: 0,
    is_deleted: false,
  },
];

const mockWorkspaceContext = {
  pages: mockPages,
  tree: [mockPages[0]],
  activePageId: "1",
  setActivePageId: vi.fn(),
  createPage: vi.fn(() => mockPages[0]),
  updatePage: vi.fn(),
  deletePage: vi.fn(),
  reorderPagesOpt: vi.fn(),
  loading: false,
};

vi.mock("@/context/WorkspaceContext", () => ({
  useWorkspace: () => mockWorkspaceContext,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/sidebar/Sidebar", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar" className="hidden sm:flex">
      {children}
    </div>
  ),
}));

vi.mock("@/components/sidebar/SortablePageList", () => ({
  default: ({ onSelect, tree }: any) => (
    <div data-testid="page-list">
      {tree.map((page: any) => (
        <button key={page.id} onClick={() => onSelect(page)}>
          {page.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/components/page/EditorPage", () => ({
  default: () => <div data-testid="editor-page">Editor</div>,
}));

vi.mock("@/components/page/EmptyState", () => ({
  default: () => <div data-testid="empty-state">Empty</div>,
}));

vi.mock("@/components/ui/ConfirmModal", () => ({
  default: () => <div data-testid="confirm-modal" />,
}));

describe("WorkspacePage - Mobile Menu", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("should display mobile header on mobile (sm:hidden)", () => {
    render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sm:hidden");
  });

  it("should show hamburger button on mobile", () => {
    render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );

    const button = screen.getByTestId("mobile-menu-button");
    expect(button).toBeInTheDocument();
  });

  it("should toggle mobile drawer when hamburger button clicked", () => {
    render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );

    const button = screen.getByTestId("mobile-menu-button");
    const drawer = screen.getByTestId("mobile-drawer");

    // Initially drawer should be hidden (off-screen)
    expect(drawer).toHaveClass("-translate-x-full");

    // Click to open
    fireEvent.click(button);
    expect(drawer).toHaveClass("translate-x-0");

    // Click to close
    fireEvent.click(button);
    expect(drawer).toHaveClass("-translate-x-full");
  });

  it("should close drawer when overlay clicked", () => {
    render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );

    const button = screen.getByTestId("mobile-menu-button");
    fireEvent.click(button); // Open drawer

    const overlay = screen.getByTestId("mobile-drawer-overlay");
    fireEvent.click(overlay);

    const drawer = screen.getByTestId("mobile-drawer");
    expect(drawer).toHaveClass("-translate-x-full");
  });

  it("should show LogBlock title in mobile header", () => {
    render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );

    const header = screen.getByRole("banner");
    expect(header).toHaveTextContent("LogBlock");
  });

  it("should hide drawer on desktop (sm:hidden)", () => {
    render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );

    const drawer = screen.getByTestId("mobile-drawer");
    expect(drawer).toHaveClass("sm:hidden");
  });

  it("should close drawer when page selected from mobile menu", () => {
    render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );

    const button = screen.getByTestId("mobile-menu-button");
    fireEvent.click(button); // Open drawer

    const drawer = screen.getByTestId("mobile-drawer");
    const pageButtons = screen.getAllByText("Home");
    // Click the Home button that's inside the mobile drawer (second one)
    fireEvent.click(pageButtons[1]);

    expect(drawer).toHaveClass("-translate-x-full");
  });

  it("should show drawer overlay only when drawer is open", () => {
    render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );

    // Overlay should not exist initially
    expect(screen.queryByTestId("mobile-drawer-overlay")).not.toBeInTheDocument();

    // Open drawer
    const button = screen.getByTestId("mobile-menu-button");
    fireEvent.click(button);

    // Overlay should now exist
    expect(screen.getByTestId("mobile-drawer-overlay")).toBeInTheDocument();
  });
});
