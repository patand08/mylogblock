import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InlineInput from "./InlineInput";

describe("InlineInput", () => {
  it("renders with value", () => {
    render(<InlineInput value="My Page" onChange={vi.fn()} onCommit={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("My Page");
  });

  it("calls onChange on input", () => {
    const onChange = vi.fn();
    render(<InlineInput value="" onChange={onChange} onCommit={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "New" } });
    expect(onChange).toHaveBeenCalledWith("New");
  });

  it("calls onCommit on Enter", () => {
    const onCommit = vi.fn();
    render(<InlineInput value="Title" onChange={vi.fn()} onCommit={onCommit} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onCommit).toHaveBeenCalledWith("Title");
  });

  it("calls onCommit on blur", () => {
    const onCommit = vi.fn();
    render(<InlineInput value="Title" onChange={vi.fn()} onCommit={onCommit} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onCommit).toHaveBeenCalledWith("Title");
  });

  it("calls onCancel on Escape", () => {
    const onCancel = vi.fn();
    render(<InlineInput value="Title" onChange={vi.fn()} onCommit={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows placeholder", () => {
    render(<InlineInput value="" onChange={vi.fn()} onCommit={vi.fn()} placeholder="Untitled" />);
    expect(screen.getByPlaceholderText("Untitled")).toBeInTheDocument();
  });
});
