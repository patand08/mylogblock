import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "./Sidebar";

function renderSidebar(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Sidebar", () => {
  it("renders with aria label", () => {
    renderSidebar(<Sidebar />);
    expect(screen.getByRole("complementary", { name: "Sidebar" })).toBeInTheDocument();
  });

  it("shows MyLogBlock title when expanded", () => {
    renderSidebar(<Sidebar collapsed={false} />);
    expect(screen.getByText("MyLogBlock")).toBeInTheDocument();
  });

  it("hides title when collapsed", () => {
    renderSidebar(<Sidebar collapsed={true} />);
    expect(screen.queryByText("MyLogBlock")).not.toBeInTheDocument();
  });

  it("shows collapse button when expanded", () => {
    renderSidebar(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
  });

  it("shows expand button when collapsed", () => {
    renderSidebar(<Sidebar collapsed={true} onToggleCollapse={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("calls onToggleCollapse when toggle button clicked", () => {
    const fn = vi.fn();
    renderSidebar(<Sidebar collapsed={false} onToggleCollapse={fn} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("renders children in sidebar content area", () => {
    renderSidebar(<Sidebar><div data-testid="child">child</div></Sidebar>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("hides children content when collapsed", () => {
    renderSidebar(<Sidebar collapsed><div data-testid="child">child</div></Sidebar>);
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });
});
