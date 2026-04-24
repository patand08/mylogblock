import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PageHeader from "./PageHeader";
import { Page } from "@/types";

vi.mock("@/components/ui/EmojiPickerPopover", () => ({
  default: ({ value, onChange }: { value: string | null; onChange: (e: string) => void }) => (
    <button data-testid="emoji-trigger" onClick={() => onChange("🎉")}>{value ?? "📄"}</button>
  ),
}));

vi.mock("@/lib/storageRepo", () => ({
  uploadCoverImage: vi.fn().mockResolvedValue("https://cdn.example.com/cover.jpg"),
}));

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: "p1", workspace_id: "ws1", parent_id: null, title: "My Page",
    icon: null, cover_image_url: null, created_at: "", updated_at: "",
    created_by: "u1", order_index: 0, is_deleted: false, ...overrides,
  };
}

const defaultProps = {
  crumbs: [] as Page[],
  onNavigate: vi.fn(),
  onUpdate: vi.fn(),
};

describe("PageHeader", () => {
  it("renders page title", () => {
    render(<PageHeader page={makePage({ title: "Hello" })} {...defaultProps} />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Hello");
  });

  it("renders page icon when set", () => {
    render(<PageHeader page={makePage({ icon: "🚀" })} {...defaultProps} />);
    expect(screen.getByTestId("emoji-trigger")).toHaveTextContent("🚀");
  });

  it("shows default icon when no icon set", () => {
    render(<PageHeader page={makePage({ icon: null })} {...defaultProps} />);
    expect(screen.getByTestId("emoji-trigger")).toHaveTextContent("📄");
  });

  it("calls onUpdate with new emoji when picker changes", () => {
    const onUpdate = vi.fn();
    render(<PageHeader page={makePage({ id: "p1" })} {...defaultProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("emoji-trigger"));
    expect(onUpdate).toHaveBeenCalledWith("p1", { icon: "🎉" });
  });

  it("renders cover image when url set", () => {
    render(<PageHeader page={makePage({ cover_image_url: "https://img.url/cover.jpg" })} {...defaultProps} />);
    expect(screen.getByTestId("cover-image")).toBeInTheDocument();
  });

  it("does not render cover image when null", () => {
    render(<PageHeader page={makePage({ cover_image_url: null })} {...defaultProps} />);
    expect(screen.queryByTestId("cover-image")).not.toBeInTheDocument();
  });

  it("clicking title switches to edit mode", () => {
    render(<PageHeader page={makePage({ title: "Click Me" })} {...defaultProps} />);
    fireEvent.click(screen.getByTestId("page-title"));
    expect(screen.getByTestId("page-title-input")).toBeInTheDocument();
  });

  it("calls onUpdate when title committed with Enter", () => {
    const onUpdate = vi.fn();
    render(<PageHeader page={makePage({ id: "p1", title: "Old" })} {...defaultProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("page-title"));
    const input = screen.getByTestId("page-title-input");
    fireEvent.change(input, { target: { value: "New Title" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onUpdate).toHaveBeenCalledWith("p1", { title: "New Title" });
  });

  it("calls onUpdate when title committed on blur", () => {
    const onUpdate = vi.fn();
    render(<PageHeader page={makePage({ id: "p1", title: "Old" })} {...defaultProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("page-title"));
    fireEvent.change(screen.getByTestId("page-title-input"), { target: { value: "Via Blur" } });
    fireEvent.blur(screen.getByTestId("page-title-input"));
    expect(onUpdate).toHaveBeenCalledWith("p1", { title: "Via Blur" });
  });

  it("renders breadcrumbs when provided", () => {
    const crumbs = [makePage({ id: "root", title: "Root" }), makePage({ id: "p1", title: "My Page" })];
    render(<PageHeader page={makePage({ id: "p1" })} crumbs={crumbs} onNavigate={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByText("Root")).toBeInTheDocument();
  });

  it("shows add-cover button when no cover image", () => {
    render(<PageHeader page={makePage({ cover_image_url: null })} {...defaultProps} />);
    expect(screen.getByTestId("add-cover-btn")).toBeInTheDocument();
  });

  it("shows cover image when set", () => {
    render(<PageHeader page={makePage({ cover_image_url: "https://img.url/c.jpg" })} {...defaultProps} />);
    expect(screen.getByTestId("cover-image")).toBeInTheDocument();
  });

  it("shows remove-cover button when cover image set", () => {
    render(<PageHeader page={makePage({ cover_image_url: "https://img.url/c.jpg" })} {...defaultProps} />);
    expect(screen.getByTestId("remove-cover-btn")).toBeInTheDocument();
  });

  it("calls onUpdate with null when remove-cover clicked", () => {
    const onUpdate = vi.fn();
    render(<PageHeader page={makePage({ id: "p1", cover_image_url: "https://img.url/c.jpg" })} {...defaultProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("remove-cover-btn"));
    expect(onUpdate).toHaveBeenCalledWith("p1", { cover_image_url: null });
  });
});
