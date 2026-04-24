import { SideMenuExtension } from "@blocknote/core/extensions";
import { useBlockNoteEditor, useExtensionState } from "@blocknote/react";
import { Menu } from "@mantine/core";

export function DuplicateBlockItem() {
  const editor = useBlockNoteEditor<any, any, any>();
  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  if (block === undefined) return null;

  return (
    <Menu.Item
      onClick={() => {
        editor.insertBlocks(
          [{ type: block.type, props: block.props, content: block.content } as any],
          block,
          "after"
        );
        editor.focus();
      }}
    >
      Duplicate
    </Menu.Item>
  );
}
