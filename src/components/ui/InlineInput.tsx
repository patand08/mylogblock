import { useEffect, useRef, KeyboardEvent } from "react";
import clsx from "clsx";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function InlineInput({
  value,
  onChange,
  onCommit,
  onCancel,
  placeholder = "Untitled",
  className,
  autoFocus = true,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onCommit(value);
    }
    if (e.key === "Escape") {
      onCancel?.();
    }
  }

  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKey}
      onBlur={() => onCommit(value)}
      placeholder={placeholder}
      className={clsx(
        "bg-transparent border-none outline-none text-lb-text w-full",
        "placeholder-lb-text-muted caret-lb-neon-purple",
        className
      )}
    />
  );
}
