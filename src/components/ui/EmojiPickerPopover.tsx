import { useState } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

interface Props {
  value: string | null;
  onChange: (emoji: string) => void;
}

export default function EmojiPickerPopover({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function handlePick(data: EmojiClickData) {
    onChange(data.emoji);
    setOpen(false);
  }

  return (
    <div className="relative inline-block">
      <button
        data-testid="emoji-trigger"
        onClick={() => setOpen((v) => !v)}
        className="text-4xl hover:opacity-80 transition-opacity cursor-pointer select-none"
        aria-label="Change page icon"
      >
        {value ?? "📄"}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50">
          <EmojiPicker onEmojiClick={handlePick} theme={Theme.DARK} lazyLoadEmojis />
        </div>
      )}
    </div>
  );
}
