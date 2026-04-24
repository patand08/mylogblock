import { useState, useEffect, useRef, useCallback } from "react";
import { checkSlugAvailable, setPageSlug } from "@/lib/pageRepo";
import { Page } from "@/types";
import Twemoji from "@/components/ui/Twemoji";

const RESERVED = new Set(["page", "api", "mcp", "health"]);
const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

function sanitize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")       // spaces → hyphens
    .replace(/[^a-z0-9-]/g, "") // strip everything else
    .replace(/-{2,}/g, "-");    // collapse double hyphens
}

function validate(slug: string): string | null {
  if (slug.length === 0) return null; // empty = remove slug, always valid
  if (slug.length < 2) return "Slug must be at least 2 characters";
  if (slug.length > 60) return "Slug must be 60 characters or fewer";
  if (!SLUG_RE.test(slug)) return "Only lowercase letters, numbers, and hyphens — no leading/trailing hyphens";
  if (RESERVED.has(slug)) return `"${slug}" is a reserved word`;
  return null;
}

interface Props {
  page: Page;
  open: boolean;
  onClose: () => void;
  onSaved: (slug: string | null) => void;
}

export default function SlugModal({ page, open, onClose, onSaved }: Props) {
  const [value, setValue] = useState(page.slug ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when the modal opens or page changes
  useEffect(() => {
    if (open) {
      setValue(page.slug ?? "");
      setValidationError(null);
      setServerError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, page.slug]);

  function handleChange(raw: string) {
    const cleaned = sanitize(raw);
    setValue(cleaned);
    setServerError(null);

    const err = validate(cleaned);
    setValidationError(err);

    // Live availability check (debounced)
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (cleaned.length >= 2 && !err && cleaned !== page.slug) {
      setChecking(true);
      checkTimer.current = setTimeout(async () => {
        try {
          const available = await checkSlugAvailable(cleaned, page.id);
          if (!available) setValidationError("This slug is already taken");
        } catch {
          // silent — save will catch DB errors
        } finally {
          setChecking(false);
        }
      }, 400);
    } else {
      setChecking(false);
    }
  }

  async function handleSave() {
    const trimmed = value.trim();

    // Empty = clear slug
    if (trimmed === "") {
      setSaving(true);
      try {
        await setPageSlug(page.id, null);
        onSaved(null);
        onClose();
      } catch (e) {
        setServerError((e as Error).message);
      } finally {
        setSaving(false);
      }
      return;
    }

    // No change
    if (trimmed === page.slug) { onClose(); return; }

    const err = validate(trimmed);
    if (err) { setValidationError(err); return; }

    setSaving(true);
    setServerError(null);
    try {
      // Final availability check before save (race condition guard)
      const available = await checkSlugAvailable(trimmed, page.id);
      if (!available) {
        setValidationError("This slug is already taken");
        setSaving(false);
        return;
      }
      await setPageSlug(page.id, trimmed);
      onSaved(trimmed);
      onClose();
    } catch (e) {
      // DB unique constraint will also surface here
      const msg = (e as Error).message;
      if (msg.includes("unique") || msg.includes("duplicate")) {
        setValidationError("This slug is already taken");
      } else {
        setServerError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const previewUrl = value.trim() ? `${baseUrl}/s/${value}` : null;
  const hasError = validationError !== null;
  const isUnchanged = value.trim() === (page.slug ?? "");

  const handleCopy = useCallback(async () => {
    if (!previewUrl) return;
    await navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [previewUrl]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-lb-surface border border-lb-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-display text-lb-text tracking-wide uppercase">
            Custom slug
          </h2>
          <button
            onClick={onClose}
            className="text-lb-text-muted hover:text-lb-text transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Page context */}
        <p className="text-xs text-lb-text-muted">
          <Twemoji text={page.icon ?? "📄"} className="mr-1 text-base" />
          <span className="text-lb-text">{page.title}</span>
        </p>

        {/* Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-lb-text-muted font-display tracking-widest uppercase">
            Slug
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !hasError && !checking) handleSave();
                if (e.key === "Escape") onClose();
              }}
              placeholder="my-page-slug"
              maxLength={60}
              className={`lb-input w-full pr-8 font-mono text-sm
                ${hasError ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/30" : ""}`}
            />
            {checking && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="w-3 h-3 rounded-full border-2 border-lb-neon-purple border-t-transparent animate-spin inline-block" />
              </span>
            )}
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-xs text-red-400">{validationError}</p>
          )}

          {/* Server error */}
          {serverError && (
            <p className="text-xs text-red-400">{serverError}</p>
          )}

          {/* URL preview + copy button */}
          {previewUrl && !hasError && (
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-lb-text-muted/60 font-mono truncate flex-1">
                {previewUrl}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy link"
                className="flex-shrink-0 text-lb-text-muted hover:text-lb-neon-purple transition-colors"
                aria-label="Copy URL"
              >
                {copied ? (
                  // Checkmark
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-lb-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  // Chain link
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
              </button>
            </div>
          )}

          <p className="text-xs text-lb-text-muted/50 mt-1">
            Leave empty to remove the current slug. Only lowercase letters, numbers, and hyphens.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* Clear button — only shown if page already has a slug */}
          {page.slug && (
            <button
              onClick={async () => {
                setSaving(true);
                try {
                  await setPageSlug(page.id, null);
                  onSaved(null);
                  onClose();
                } catch (e) {
                  setServerError((e as Error).message);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
            >
              Remove slug
            </button>
          )}

          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-lb-text-muted hover:text-lb-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || checking || hasError || isUnchanged}
              className="px-4 py-2 text-xs rounded-lg bg-lb-action-orange hover:bg-lb-action-orange/90 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <span className="opacity-60">Saving…</span> : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
