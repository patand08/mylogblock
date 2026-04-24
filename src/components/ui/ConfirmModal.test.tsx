import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ConfirmModal from "./ConfirmModal";

describe("ConfirmModal", () => {
  it("does not render when open is false", () => {
    render(<ConfirmModal open={false} title="Delete?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
  });

  it("renders when open is true", () => {
    render(<ConfirmModal open={true} title="Delete?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
  });

  it("shows title and description", () => {
    render(
      <ConfirmModal open={true} title="Delete page?" description="This cannot be undone." onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText("Delete page?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal open={true} title="Delete?" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByTestId("confirm-btn"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal open={true} title="Delete?" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal open={true} title="Delete?" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId("confirm-modal-backdrop"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel on Escape key", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal open={true} title="Delete?" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByTestId("confirm-modal"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders custom confirm label", () => {
    render(<ConfirmModal open={true} title="Delete?" confirmLabel="Yes, delete" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("confirm-btn")).toHaveTextContent("Yes, delete");
  });

  it("has backdrop blur", () => {
    render(<ConfirmModal open={true} title="Delete?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("confirm-modal-backdrop").className).toContain("backdrop-blur");
  });
});
