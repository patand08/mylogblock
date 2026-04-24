import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "brand";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold",
        "transition-colors duration-150 cursor-pointer select-none",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-lb-neon-purple",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
        variant === "primary" && "bg-lb-neon-purple hover:bg-lb-neon-purple/90 text-white",
        variant === "secondary" && "bg-lb-mid-purple/40 hover:bg-lb-mid-purple/60 text-white border border-lb-border",
        variant === "ghost" && "bg-transparent hover:bg-white/5 text-lb-text-muted hover:text-lb-text",
        variant === "danger" && "bg-lb-danger-brown hover:bg-lb-danger-brown/90 text-white",
        variant === "brand" && "bg-lb-action-orange hover:bg-lb-action-orange/90 text-white font-bold",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
