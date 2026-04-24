import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders welcome message", () => {
    render(<EmptyState onCreatePage={vi.fn()} />);
    expect(screen.getByText("LogBlock")).toBeInTheDocument();
  });

  it("renders Create page button", () => {
    render(<EmptyState onCreatePage={vi.fn()} />);
    expect(screen.getByTestId("create-first-page-btn")).toBeInTheDocument();
  });

  it("calls onCreatePage when button clicked", () => {
    const fn = vi.fn();
    render(<EmptyState onCreatePage={fn} />);
    fireEvent.click(screen.getByTestId("create-first-page-btn"));
    expect(fn).toHaveBeenCalledOnce();
  });
});
