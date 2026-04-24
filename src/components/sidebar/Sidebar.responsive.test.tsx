import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "./Sidebar";

function renderSidebar(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Sidebar - Mobile Responsiveness", () => {
  it("should be hidden on mobile by default (hidden sm:flex)", () => {
    renderSidebar(<Sidebar collapsed={false} onToggleCollapse={() => {}} />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("hidden", "sm:flex");
  });

  it("should be visible on sm breakpoint and above", () => {
    renderSidebar(<Sidebar collapsed={false} onToggleCollapse={() => {}} />);

    const sidebar = screen.getByTestId("sidebar");
    // Should have responsive width: hidden on mobile, w-64 on sm+
    expect(sidebar).toHaveClass("w-64");
  });

  it("should collapse to w-12 when collapsed on desktop", () => {
    renderSidebar(<Sidebar collapsed={true} onToggleCollapse={() => {}} />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("w-12");
  });

  it("should show collapse button with proper aria label", () => {
    const mockToggle = vi.fn();
    renderSidebar(<Sidebar collapsed={false} onToggleCollapse={mockToggle} />);

    const button = screen.getByRole("button", { name: /collapse sidebar/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockToggle).toHaveBeenCalled();
  });

  it("should be full viewport height on mobile (h-full)", () => {
    renderSidebar(<Sidebar collapsed={false} onToggleCollapse={() => {}} />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("h-full");
  });

  it("should have scrollable content area on mobile (overflow-y-auto)", () => {
    renderSidebar(
      <Sidebar collapsed={false} onToggleCollapse={() => {}}>
        <div>Test content</div>
      </Sidebar>
    );

    const content = screen.getByTestId("sidebar-content");
    expect(content).toHaveClass("overflow-y-auto");
  });
});
