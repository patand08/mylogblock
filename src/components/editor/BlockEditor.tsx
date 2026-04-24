import { Component, ReactNode, useMemo } from "react";
import {
  useCreateBlockNote,
  SideMenuController,
  SideMenu,
  DragHandleMenu,
  RemoveBlockItem,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { PartialBlock } from "@blocknote/core";
import { uploadBlockImage } from "@/lib/storageRepo";
import { sanitizeBlocks } from "@/lib/sanitizeBlocks";
import { DuplicateBlockItem } from "./DuplicateBlockItem";
import { HtmlBlock } from "./HtmlBlock";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./editor-theme.css";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    html: HtmlBlock(),
  },
});

interface Props {
  pageId: string;
  initialContent?: PartialBlock[];
  onChange?: (blocks: PartialBlock[]) => void;
}

function safeSanitize(blocks: PartialBlock[]): PartialBlock[] | undefined {
  try {
    const sanitized = sanitizeBlocks(blocks) as PartialBlock[];
    return sanitized.length > 0 ? sanitized : undefined;
  } catch (e) {
    console.warn("[BlockEditor] sanitization failed, starting empty:", e);
    return undefined;
  }
}

class EditorErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    console.warn("[BlockEditor] caught error, rendering fallback editor:", error.message);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function BlockEditorInner({ pageId, initialContent, onChange }: Props & { forceEmpty?: boolean }) {
  const safeContent = useMemo(
    () => (initialContent ? safeSanitize(initialContent) : undefined),
    [initialContent]
  );

  const editor = useCreateBlockNote(
    {
      schema,
      initialContent: safeContent as any,
      uploadFile: async (file: File) => uploadBlockImage(pageId, file),
      tables: { splitCells: true, cellBackgroundColor: true, cellTextColor: true, headers: true },
    },
    [pageId]
  );

  function handleChange() {
    if (onChange) onChange(editor.document as unknown as PartialBlock[]);
  }

  return (
    <div className="w-full">
    <BlockNoteView editor={editor} theme="light" onChange={handleChange} slashMenu={false}>
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) => {
          const defaults = getDefaultReactSlashMenuItems(editor);
          const htmlItem = {
            title: "HTML",
            subtext: "Embed custom HTML",
            onItemClick: () => {
              editor.insertBlocks(
                [{ type: "html", props: { html: "" } }],
                editor.getTextCursorPosition().block,
                "after"
              );
            },
            group: "Other",
            icon: <span style={{ fontFamily: "monospace", fontSize: 14 }}>&lt;/&gt;</span>,
          };
          return [...defaults, htmlItem].filter(
            (item) => item.title.toLowerCase().includes(query.toLowerCase())
          );
        }}
      />
      <SideMenuController
        sideMenu={() => (
          <SideMenu
            dragHandleMenu={() => (
              <DragHandleMenu>
                <RemoveBlockItem>Delete</RemoveBlockItem>
                <DuplicateBlockItem />
              </DragHandleMenu>
            )}
          />
        )}
      />
    </BlockNoteView>
    </div>
  );
}

function FallbackEditor({ pageId, onChange }: Props) {
  return <BlockEditorInner pageId={pageId} onChange={onChange} />;
}

export default function BlockEditor(props: Props) {
  return (
    <div data-testid="block-editor" className="w-full" data-color-scheme="light">
      <EditorErrorBoundary fallback={<FallbackEditor pageId={props.pageId} onChange={props.onChange} />}>
        <BlockEditorInner {...props} />
      </EditorErrorBoundary>
    </div>
  );
}
