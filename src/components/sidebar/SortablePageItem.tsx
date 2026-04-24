import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Page } from "@/types";
import { PageTreeNode } from "@/lib/page-utils";
import PageTreeItem from "./PageTreeItem";

interface Props {
  node: PageTreeNode;
  depth?: number;
  activePageId?: string | null;
  onSelect: (page: Page) => void;
  onCreateChild: (parentId: string) => void;
  onDelete: (pageId: string) => void;
  onRename: (pageId: string, title: string) => void;
}

export default function SortablePageItem({ node, ...rest }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PageTreeItem node={node} {...rest} />
    </div>
  );
}
