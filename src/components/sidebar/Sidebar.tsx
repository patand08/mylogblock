import ThemeToggle from "@/components/ui/ThemeToggle";
import clsx from "clsx";

interface Props {
  children?: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  children,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  return (
    <aside
      data-testid="sidebar"
      aria-label="Sidebar"
      className={clsx(
        "flex flex-col h-full bg-lb-sidebar border-r border-lb-border",
        "transition-all duration-200",
        "hidden sm:flex", // Hidden on mobile, visible from sm breakpoint
        collapsed ? "w-12" : "w-64"
      )}
    >
      {/* Brand accent line */}
      <div className="lb-sidebar-accent" />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-lb-border">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/mylogblock-logo.png"
              alt="MyLogBlock logo"
              className="w-5 h-5 shrink-0"
            />
            <span className="text-md font-brand truncate lb-gradient-text">
              MyLogBlock
            </span>
          </div>
        )}
        {collapsed && (
          <img
            src="/mylogblock-logo.png"
            alt="MyLogBlock logo"
            className="w-5 h-5 mx-auto"
          />
        )}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-white/5 text-lb-text-muted hover:text-lb-text ml-auto shrink-0"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto py-2"
        data-testid="sidebar-content"
      >
        {!collapsed && children}
      </div>

      {/* Night mode toggle - bottom of sidebar (always shown) */}
      <div
        className={clsx(
          "py-2 border-t border-lb-border flex",
          collapsed ? "justify-center px-0" : "px-3"
        )}
      >
        <ThemeToggle />
      </div>
    </aside>
  );
}
