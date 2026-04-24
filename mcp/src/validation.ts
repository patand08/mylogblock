const RESERVED = new Set(["page", "api", "mcp", "health"]);
const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export function sanitizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, ""); // strip leading/trailing hyphens
}

/** Returns null if valid, or an error message string if invalid. */
export function validateSlug(slug: string): string | null {
  if (slug.length === 0) return null; // empty = remove slug
  if (slug.length > 60) return "Slug must be 60 characters or fewer";
  if (!SLUG_RE.test(slug)) {
    if (/[^a-z0-9-]/.test(slug)) return "Only lowercase letters, numbers, and hyphens allowed";
    return "Slug cannot start or end with a hyphen";
  }
  if (RESERVED.has(slug)) return `"${slug}" is a reserved word`;
  return null;
}
