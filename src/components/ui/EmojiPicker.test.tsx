import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EmojiPickerPopover from "./EmojiPickerPopover";

vi.mock("@/components/ui/Twemoji", () => ({
  default: ({ text }: { text: string }) => <span data-testid="twemoji-stub">{text}</span>,
  TWEMOJI_SVG_OPTIONS: {
    base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/",
    folder: "svg",
    ext: ".svg",
  },
}));

vi.mock("emoji-picker-react", () => ({
  default: ({ onEmojiClick }: { onEmojiClick: (e: { emoji: string }) => void }) => (
    <div data-testid="emoji-picker">
      <button onClick={() => onEmojiClick({ emoji: "🎉" })}>Pick 🎉</button>
    </div>
  ),
  Theme: { DARK: "dark", LIGHT: "light", AUTO: "auto" },
  EmojiStyle: { TWITTER: "twitter", NATIVE: "native", APPLE: "apple", GOOGLE: "google", FACEBOOK: "facebook" },
}));

describe("EmojiPickerPopover", () => {
  it("renders trigger button", () => {
    render(<EmojiPickerPopover value={null} onChange={vi.fn()} />);
    expect(screen.getByTestId("emoji-trigger")).toBeInTheDocument();
  });

  it("shows default icon when no emoji set", () => {
    render(<EmojiPickerPopover value={null} onChange={vi.fn()} />);
    expect(screen.getByTestId("twemoji-stub")).toHaveTextContent("📄");
  });

  it("shows current emoji when set", () => {
    render(<EmojiPickerPopover value="🚀" onChange={vi.fn()} />);
    expect(screen.getByTestId("twemoji-stub")).toHaveTextContent("🚀");
  });

  it("opens picker on click", () => {
    render(<EmojiPickerPopover value={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId("emoji-trigger"));
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
  });

  it("calls onChange with emoji and closes picker", () => {
    const onChange = vi.fn();
    render(<EmojiPickerPopover value={null} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("emoji-trigger"));
    fireEvent.click(screen.getByText("Pick 🎉"));
    expect(onChange).toHaveBeenCalledWith("🎉");
    expect(screen.queryByTestId("emoji-picker")).not.toBeInTheDocument();
  });
});
