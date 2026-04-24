import { Page } from "@/types";
import clsx from "clsx";
import Twemoji from "@/components/ui/Twemoji";

interface Props {
  crumbs: Page[];
  onNavigate: (page: Page) => void;
  /** Called when the current (last) crumb is clicked — auth users only */
  onSlugClick?: () => void;
}

export default function Breadcrumb({ crumbs, onNavigate, onSlugClick }: Props) {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-lb-text-muted">
      {crumbs.map((page, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={page.id} className="flex items-center gap-1">
            {i > 0 && <span className="text-lb-text-muted/50">/</span>}
            <button
              onClick={() => isLast ? onSlugClick?.() : onNavigate(page)}
              aria-current={isLast ? "page" : undefined}
              title={isLast && onSlugClick ? "Click to set a custom slug" : undefined}
              className={clsx(
                "hover:text-lb-text transition-colors duration-100 max-w-[120px] truncate",
                isLast && onSlugClick
                  ? "text-lb-text cursor-pointer hover:underline decoration-dashed underline-offset-2"
                  : isLast
                  ? "text-lb-text cursor-default"
                  : "hover:underline cursor-pointer"
              )}
            >
              {page.icon && <Twemoji text={page.icon} className="mr-1 text-sm" />}
              {page.title}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
