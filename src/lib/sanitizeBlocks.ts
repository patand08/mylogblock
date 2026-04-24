/**
 * Sanitizes raw stored block data before passing to BlockNote editor.
 *
 * The legacy format stores tables as:
 *   { type: "table", content: [], children: [
 *     { type: "tableRow", content: [], children: [
 *       { type: "tableCell", content: [...inlineContent...], children: [] }
 *     ]}
 *   ]}
 *
 * BlockNote 0.47 expects:
 *   { type: "table", content: { type: "tableContent", columnWidths: [...],
 *     rows: [{ cells: [ [...inlineContent...], ... ] }]
 *   }, children: [] }
 */

const VALID_BLOCK_TYPES = new Set([
  "paragraph", "heading", "bulletListItem", "numberedListItem",
  "checkListItem", "codeBlock", "image", "video", "audio", "file",
  "table", "html",
]);

type RawBlock = Record<string, unknown>;

/** Extract inline content from a tableCell block. */
function extractCellContent(cell: RawBlock): unknown[] {
  if (Array.isArray(cell.content) && cell.content.length > 0) return cell.content;
  return [];
}

/**
 * Convert a legacy children-based table block to BlockNote 0.47 tableContent format.
 *
 * Legacy: table.children = [tableRow, tableRow, ...]
 *         tableRow.children = [tableCell, tableCell, ...]
 *         tableCell.content = [...inlineContent...]
 */
function convertChildrenTable(block: RawBlock): RawBlock {
  const tableChildren = Array.isArray(block.children) ? block.children : [];

  const rows: { cells: unknown[][] }[] = [];

  for (const child of tableChildren) {
    if (!child || typeof child !== "object") continue;
    const row = child as RawBlock;
    if (row.type !== "tableRow") continue;

    const rowChildren = Array.isArray(row.children) ? row.children : [];
    const cells: unknown[][] = [];

    for (const cellBlock of rowChildren) {
      if (!cellBlock || typeof cellBlock !== "object") continue;
      const cell = cellBlock as RawBlock;
      if (cell.type !== "tableCell") continue;
      cells.push(extractCellContent(cell));
    }

    if (cells.length > 0) {
      rows.push({ cells });
    }
  }

  if (rows.length === 0) {
    // No rows recovered — return empty paragraph
    return { type: "paragraph", props: {}, content: [], children: [] };
  }

  const numCols = Math.max(...rows.map((r) => r.cells.length));

  return {
    type: "table",
    props: block.props ?? {},
    content: {
      type: "tableContent",
      columnWidths: Array(numCols).fill(undefined),
      rows,
    },
    children: [],
  };
}

/**
 * Check if a table block is in correct BlockNote 0.47 format.
 */
function isValidTableContent(block: RawBlock): boolean {
  const content = block.content;
  if (!content || typeof content !== "object" || Array.isArray(content)) return false;
  const tc = content as RawBlock;
  return tc.type === "tableContent" && Array.isArray(tc.rows);
}

/**
 * Sanitize a table block. Handles:
 * 1. Legacy children-based format (table > tableRow > tableCell in children)
 * 2. Already valid tableContent format (pass through)
 * 3. Empty/broken content with children (convert from children)
 */
function sanitizeTableBlock(block: RawBlock): RawBlock {
  // Already valid format
  if (isValidTableContent(block)) {
    return { ...block, children: [] };
  }

  // Has children with tableRow/tableCell → convert
  if (Array.isArray(block.children) && block.children.length > 0) {
    return convertChildrenTable(block);
  }

  // Content is array of tableRows/tableCells
  if (Array.isArray(block.content) && block.content.length > 0) {
    // Treat content array as if it were children
    const asChildren = { ...block, children: block.content };
    return convertChildrenTable(asChildren);
  }

  // Empty table — return as empty paragraph
  return { type: "paragraph", props: {}, content: [], children: [] };
}

/** Recursively sanitize an array of blocks. */
export function sanitizeBlocks(blocks: unknown[]): unknown[] {
  if (!Array.isArray(blocks)) return [];

  const result: RawBlock[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i] as RawBlock;
    if (!block || typeof block !== "object") {
      i++;
      continue;
    }

    const type = block.type as string;

    // Table block — convert from legacy format if needed
    if (type === "table") {
      result.push(sanitizeTableBlock(block));
      i++;
      continue;
    }

    // Top-level tableCell/tableRow (shouldn't happen, but handle it)
    if (type === "tableCell" || type === "tableRow") {
      // Collect consecutive fragments
      const fragments: RawBlock[] = [];
      while (
        i < blocks.length &&
        ((blocks[i] as RawBlock).type === "tableCell" ||
          (blocks[i] as RawBlock).type === "tableRow")
      ) {
        fragments.push(blocks[i] as RawBlock);
        i++;
      }
      // Wrap in a fake table and convert
      const fakeTable: RawBlock = { type: "table", content: [], children: fragments };
      result.push(convertChildrenTable(fakeTable));
      continue;
    }

    // Valid block type — recurse into children
    if (VALID_BLOCK_TYPES.has(type)) {
      const sanitized = { ...block };
      if (Array.isArray(block.children) && block.children.length > 0) {
        sanitized.children = sanitizeBlocks(block.children as unknown[]);
      }
      result.push(sanitized);
      i++;
      continue;
    }

    // Unknown type → paragraph with text content preserved
    const text = extractTextDeep(block);
    result.push({
      type: "paragraph",
      props: {},
      content: text ? [{ type: "text", text, styles: {} }] : [],
      children: [],
    });
    i++;
  }

  return result;
}

/** Deep text extraction from any structure. */
function extractTextDeep(obj: unknown): string {
  if (typeof obj === "string") return obj;
  if (!obj || typeof obj !== "object") return "";
  if (Array.isArray(obj)) return obj.map(extractTextDeep).join("");
  const o = obj as RawBlock;
  if (typeof o.text === "string") return o.text;
  let result = "";
  if (o.content) result += extractTextDeep(o.content);
  if (o.children) result += extractTextDeep(o.children);
  return result;
}
