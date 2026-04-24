import { useEffect, useState } from "react";
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from "emoji-picker-react";
import Twemoji from "@/components/ui/Twemoji";

/** Match app theme without requiring ThemeProvider (e.g. unit tests). */
function usePickerTheme(): Theme {
  const [pickerTheme, setPickerTheme] = useState<Theme>(() =>
    typeof document !== "undefined" &&
    (document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark"))
      ? Theme.DARK
      : Theme.LIGHT
  );
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => {
      setPickerTheme(
        el.getAttribute("data-theme") === "dark" || el.classList.contains("dark") ? Theme.DARK : Theme.LIGHT
      );
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => obs.disconnect();
  }, []);
  return pickerTheme;
}

interface Props {
  value: string | null;
  onChange: (emoji: string) => void;
}

export default function EmojiPickerPopover({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const pickerTheme = usePickerTheme();

  function handlePick(data: EmojiClickData) {
    onChange(data.emoji);
    setOpen(false);
  }

  return (
    <div className="relative inline-block">
      <button
        data-testid="emoji-trigger"
        onClick={() => setOpen((v) => !v)}
        className="text-4xl hover:opacity-80 transition-opacity cursor-pointer select-none leading-none"
        aria-label="Change page icon"
      >
        <Twemoji text={value ?? "📄"} className="text-4xl" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50">
          <EmojiPicker
            onEmojiClick={handlePick}
            theme={pickerTheme}
            emojiStyle={EmojiStyle.TWITTER}
            lazyLoadEmojis
          />
        </div>
      )}
    </div>
  );
}
