import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import IconButton from "./IconButton";

describe("IconButton", () => {
  it("renders with aria-label", () => {
    render(<IconButton label="Close">✕</IconButton>);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const fn = vi.fn();
    render(<IconButton label="Click me" onClick={fn}>X</IconButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("can be disabled", () => {
    render(<IconButton label="Disabled" disabled>X</IconButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies sm size class", () => {
    render(<IconButton label="Small" size="sm">X</IconButton>);
    expect(screen.getByRole("button").className).toMatch(/w-5/);
  });
});
