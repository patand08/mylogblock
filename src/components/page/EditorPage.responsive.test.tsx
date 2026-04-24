import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EditorPage from "./EditorPage";
import { Page } from "@/types";

const mockPage: Page = {
  id: "test-page",
  workspace_id: "ws-1",
  title: "Test Page",
  icon: "📄",
  body: [{ type: "paragraph", content: [{ type: "text", text: "Test content" }] }],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  parent_id: null,
  slug: null,
  cover_image_url: null,
  created_by: "user-1",
  order_index: 0,
  is_deleted: false,
};

const mockPages: Page[] = [mockPage];

describe("EditorPage - Mobile Responsiveness", () => {
  beforeEach(() => {
    // Mock matchMedia for Mantine
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

    // Reset window size
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("should have responsive horizontal padding on header (px-4 sm:px-8 lg:px-16)", () => {
    render(
      <EditorPage
        page={mockPage}
        allPages={mockPages}
        onNavigate={() => {}}
        onUpdatePage={() => {}}
      />
    );

    const headerBlock = screen.getByTestId("page-header").querySelector(".px-4");
    expect(headerBlock).toBeTruthy();
    expect(headerBlock).toHaveClass("px-4", "sm:px-8", "lg:px-16");
  });

  it("should have responsive bottom padding on editor content (pb-4 sm:pb-8 lg:pb-16)", () => {
    render(
      <EditorPage
        page={mockPage}
        allPages={mockPages}
        onNavigate={() => {}}
        onUpdatePage={() => {}}
      />
    );

    const contentArea = screen.getByTestId("editor-content");
    expect(contentArea).toHaveClass("pb-4", "sm:pb-8", "lg:pb-16");
  });

  it("should use flex column layout", () => {
    render(
      <EditorPage
        page={mockPage}
        allPages={mockPages}
        onNavigate={() => {}}
        onUpdatePage={() => {}}
      />
    );

    const editor = screen.getByTestId("editor-page");
    expect(editor).toHaveClass("flex", "flex-col");
  });

  it("should have full height container", () => {
    render(
      <EditorPage
        page={mockPage}
        allPages={mockPages}
        onNavigate={() => {}}
        onUpdatePage={() => {}}
      />
    );

    const editor = screen.getByTestId("editor-page");
    expect(editor).toHaveClass("h-full");
  });

  it("should have scrollable content area (overflow-y-auto)", () => {
    render(
      <EditorPage
        page={mockPage}
        allPages={mockPages}
        onNavigate={() => {}}
        onUpdatePage={() => {}}
      />
    );

    const editor = screen.getByTestId("editor-page");
    expect(editor).toHaveClass("overflow-y-auto");
  });
});
