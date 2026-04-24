import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md";
}

export default function IconButton({ label, size = "md", className, children, ...rest }: Props) {
  return (
    <button
      aria-label={label}
      className={clsx(
        "inline-flex items-center justify-center rounded-md text-lb-text-muted",
        "hover:bg-white/8 hover:text-lb-text transition-colors duration-100",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-lb-neon-purple",
        size === "sm" ? "w-5 h-5 text-xs" : "w-7 h-7 text-sm",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
