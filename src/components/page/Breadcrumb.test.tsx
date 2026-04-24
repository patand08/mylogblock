import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/ui/Twemoji", () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
  TWEMOJI_SVG_OPTIONS: {},
}));

import Breadcrumb from "./Breadcrumb";
import { Page } from "@/types";

function makePage(id: string, title: string): Page {
  return {
    id, workspace_id: "ws1", parent_id: null, title, icon: null,
    cover_image_url: null, created_at: "", updated_at: "",
    created_by: "u1", order_index: 0, is_deleted: false,
  };
}

describe("Breadcrumb", () => {
  it("renders nothing with empty crumbs", () => {
    const { container } = render(<Breadcrumb crumbs={[]} onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders single crumb", () => {
    render(<Breadcrumb crumbs={[makePage("1", "Home")]} onNavigate={vi.fn()} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders multiple crumbs separated by /", () => {
    const crumbs = [makePage("1", "Root"), makePage("2", "Child")];
    render(<Breadcrumb crumbs={crumbs} onNavigate={vi.fn()} />);
    expect(screen.getByText("Root")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(screen.getByText("/")).toBeInTheDocument();
  });

  it("last crumb has aria-current=page", () => {
    const crumbs = [makePage("1", "Root"), makePage("2", "Leaf")];
    render(<Breadcrumb crumbs={crumbs} onNavigate={vi.fn()} />);
    expect(screen.getByText("Leaf")).toHaveAttribute("aria-current", "page");
  });

  it("last crumb does not navigate when clicked (without onSlugClick)", () => {
    const onNavigate = vi.fn();
    const crumbs = [makePage("1", "Root"), makePage("2", "Leaf")];
    render(<Breadcrumb crumbs={crumbs} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Leaf"));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("calls onNavigate when non-last crumb clicked", () => {
    const onNavigate = vi.fn();
    const root = makePage("1", "Root");
    const leaf = makePage("2", "Leaf");
    render(<Breadcrumb crumbs={[root, leaf]} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Root"));
    expect(onNavigate).toHaveBeenCalledWith(root);
  });

  it("shows page icon in crumb", () => {
    const page = { ...makePage("1", "Starred"), icon: "⭐" };
    render(<Breadcrumb crumbs={[page]} onNavigate={vi.fn()} />);
    expect(screen.getByText("⭐")).toBeInTheDocument();
  });
});
