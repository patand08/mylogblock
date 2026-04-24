import { useState } from "react";
import { createReactBlockSpec } from "@blocknote/react";

export const HtmlBlock = createReactBlockSpec(
  {
    type: "html" as const,
    propSchema: {
      html: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const [editing, setEditing] = useState(false);
      const [draft, setDraft] = useState(block.props.html);
      const html = block.props.html;

      function commit() {
        editor.updateBlock(block, { props: { html: draft } });
        setEditing(false);
      }

      function cancel() {
        setDraft(block.props.html);
        setEditing(false);
      }

      if (editing) {
        return (
          <div className="w-full rounded-lg overflow-hidden border border-lb-border">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-lb-surface-2 border-b border-lb-border text-xs font-mono">
              <span className="text-lb-accent-green/70 font-display tracking-widest uppercase text-[10px]">HTML</span>
              <div className="flex gap-2">
                <button
                  onMouseDown={(e) => { e.preventDefault(); commit(); }}
                  className="px-2 py-0.5 rounded bg-lb-accent-green/90 hover:bg-lb-accent-green text-black font-bold text-[11px]"
                >
                  Render
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); cancel(); }}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-lb-text-muted text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
            {/* Editor */}
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) commit();
              }}
              spellCheck={false}
              className="w-full bg-[#0a0a0a] text-lb-text font-mono text-sm p-3 outline-none resize-none min-h-[120px]"
              placeholder="<div>Your HTML here…</div>"
            />
            <p className="text-[10px] text-lb-text-muted/50 px-3 py-1 bg-lb-surface-2">
              Ctrl+Enter to render
            </p>
          </div>
        );
      }

      // Preview mode
      return (
        <div className="group/html relative w-full">
          {html ? (
            <div className="relative">
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><style>
                  * { box-sizing: border-box; margin: 0; padding: 0; }
                  body { font-family: system-ui, sans-serif; color: #000; background: transparent; padding: 8px; }
                  a { color: #99FF32; }
                </style></head><body>${html}</body></html>`}
                sandbox="allow-scripts"
                className="w-full border-0 rounded-lg bg-transparent"
                style={{ minHeight: "40px" }}
                onLoad={(e) => {
                  const iframe = e.currentTarget;
                  const body = iframe.contentDocument?.body;
                  if (body) {
                    const observer = new ResizeObserver(() => {
                      iframe.style.height = body.scrollHeight + 16 + "px";
                    });
                    observer.observe(body);
                    iframe.style.height = body.scrollHeight + 16 + "px";
                  }
                }}
              />
              {/* Edit overlay */}
              <button
                onClick={() => { setDraft(html); setEditing(true); }}
                className="absolute top-2 right-2 opacity-0 group-hover/html:opacity-100
                           px-2 py-0.5 rounded bg-lb-surface/80 border border-lb-border
                           text-lb-text-muted hover:text-lb-text text-[11px] font-display
                           transition-opacity duration-150"
              >
                Edit HTML
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setDraft(""); setEditing(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed
                         border-lb-border text-lb-text-muted hover:text-lb-text
                         hover:border-lb-accent-green/60 transition-colors text-sm"
            >
              <span className="text-lb-accent-green/60">&lt;/&gt;</span>
              <span>Add HTML block</span>
            </button>
          )}
        </div>
      );
    },
  }
);
