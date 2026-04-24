import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/storageRepo", () => ({
  uploadBlockImage: vi.fn().mockResolvedValue("https://cdn.example.com/img.jpg"),
}));

vi.mock("@blocknote/react", () => ({
  useCreateBlockNote: vi.fn(() => ({ document: [] })),
  SideMenuController: () => null,
  SideMenu: () => null,
  DragHandleMenu: ({ children }: any) => <>{children}</>,
  RemoveBlockItem: ({ children }: any) => <>{children}</>,
  useBlockNoteEditor: vi.fn(() => ({})),
  useExtensionState: vi.fn(() => undefined),
  SuggestionMenuController: () => null,
  getDefaultReactSlashMenuItems: vi.fn(() => []),
  createReactBlockSpec: vi.fn(() => vi.fn(() => ({}))),
}));
vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: ({ editor, children }: any) => (
    <div data-testid="blocknote-view" data-editor={!!editor ? "true" : "false"}>
      Editor loaded
      {children}
    </div>
  ),
}));
vi.mock("@blocknote/core", () => ({
  BlockNoteSchema: { create: vi.fn(() => ({})) },
  defaultBlockSpecs: {},
}));
vi.mock("@blocknote/core/extensions", () => ({ SideMenuExtension: {} }));
vi.mock("@mantine/core", () => ({ Menu: { Item: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button> } }));
vi.mock("@blocknote/core/fonts/inter.css", () => ({}));
vi.mock("@blocknote/mantine/style.css", () => ({}));

import BlockEditor from "./BlockEditor";

describe("BlockEditor", () => {
  it("renders the editor container", () => {
    render(<BlockEditor pageId="p1" />);
    expect(screen.getByTestId("block-editor")).toBeInTheDocument();
  });

  it("renders BlockNoteView inside", () => {
    render(<BlockEditor pageId="p1" />);
    expect(screen.getByTestId("blocknote-view")).toBeInTheDocument();
  });

  it("passes editor instance to BlockNoteView", () => {
    render(<BlockEditor pageId="p1" />);
    expect(screen.getByTestId("blocknote-view")).toHaveAttribute("data-editor", "true");
  });

  it("renders with different pageId", () => {
    render(<BlockEditor pageId="page-xyz" />);
    expect(screen.getByTestId("block-editor")).toBeInTheDocument();
  });

  it("passes uploadFile to useCreateBlockNote", async () => {
    const mod = await import("@blocknote/react");
    const useCreateBlockNote = vi.mocked(mod.useCreateBlockNote);
    render(<BlockEditor pageId="p1" />);
    const opts = useCreateBlockNote.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof opts?.uploadFile).toBe("function");
  });
});
