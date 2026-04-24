import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

describe("Sidebar - Mobile Responsiveness", () => {
  it("should be hidden on mobile by default (hidden sm:flex)", () => {
    render(<Sidebar collapsed={false} onToggleCollapse={() => {}} />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("hidden", "sm:flex");
  });

  it("should be visible on sm breakpoint and above", () => {
    render(<Sidebar collapsed={false} onToggleCollapse={() => {}} />);

    const sidebar = screen.getByTestId("sidebar");
    // Should have responsive width: hidden on mobile, w-64 on sm+
    expect(sidebar).toHaveClass("w-64");
  });

  it("should collapse to w-12 when collapsed on desktop", () => {
    render(<Sidebar collapsed={true} onToggleCollapse={() => {}} />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("w-12");
  });

  it("should show collapse button with proper aria label", () => {
    const mockToggle = vi.fn();
    render(<Sidebar collapsed={false} onToggleCollapse={mockToggle} />);

    const button = screen.getByRole("button", { name: /collapse sidebar/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockToggle).toHaveBeenCalled();
  });

  it("should be full viewport height on mobile (h-full)", () => {
    render(<Sidebar collapsed={false} onToggleCollapse={() => {}} />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("h-full");
  });

  it("should have scrollable content area on mobile (overflow-y-auto)", () => {
    render(
      <Sidebar collapsed={false} onToggleCollapse={() => {}}>
        <div>Test content</div>
      </Sidebar>
    );

    const content = screen.getByTestId("sidebar-content");
    expect(content).toHaveClass("overflow-y-auto");
  });
});
