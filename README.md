# MyLogBlock

A personal knowledge workspace built as a full-stack portfolio project. Block-based note-taking with nested pages, real-time persistence, read-only sharing, and an AI assistant integration via MCP — built entirely from scratch.

Live: [mylogblock.vercel.app](https://mylogblock.vercel.app)

---

## What It Is

MyLogBlock is a Notion-inspired workspace where pages contain rich block content (paragraphs, headings, to-dos, code blocks, tables, images, embedded HTML, and more). Pages can be nested infinitely, reordered via drag-and-drop, and shared publicly as read-only links. The entire editor, sidebar, routing, persistence layer, and AI integration were built without templates or boilerplate.

---

## Features

### Editor

- **Block editor** powered by BlockNote — slash command menu (`/`) for inserting any block type
- **Block types** — paragraph, heading (h1–h3), bulleted/numbered/to-do lists, code block, callout, divider, image, audio, video, file, table, and custom HTML embed
- **Rich inline text** — bold, italic, underline, strikethrough, inline code, links
- **Custom block duplicate** — added to the drag-handle side menu
- **Drag handles** — reorder blocks within a page

### Pages

- **Infinite nesting** — pages can have sub-pages and sub-sub-pages
- **Tree drag-and-drop** — reorder pages at any level, move across branches, nest (indent) and outdent pages via horizontal drag
- **Page icons** — emoji picker per page (header + sidebar)
- **Cover images** — upload, reposition vertically, and remove cover photos
- **Breadcrumb trail** — clickable hierarchy navigation
- **Sidebar search** — real-time filter by page title
- **Inline rename** — click-to-edit page titles in the sidebar
- **Drag hint overlay** — contextual hint during drag (`reorder`, `make child`, `move out`) with reserved layout space to avoid flicker

### Sharing & Read-Only Mode

- **Public read-only view** — any page subtree accessible via `/page/:id` without authentication
- **Custom slug URLs** — assign a short slug to any page, accessible at `/s/:slug`
- **Read-only editor** — full block rendering with no edit interactions, same dark/light theme
- **Stable read-only navigation** — sidebar page switches update title + content reliably (editor remount on page change)

### UI & UX

- **Dark / light theme** — persistent toggle, shared across all views via React context
- **Responsive layout** — mobile drawer menu with hamburger navigation, desktop sidebar with collapse
- **Lock screen** — optional access code to protect the workspace (env-configured)
- **Warm "old paper" light theme + navy dark theme** — custom BlockNote color overrides
- **Active page highlight** — persistent selected-state contrast in sidebar for both light/dark themes
- **Page transition skeletons** — animated shimmer skeleton for content transitions (workspace + read-only)

### MCP Server (AI Integration)

- **Model Context Protocol server** deployed alongside the app
- Exposes workspace pages as tools consumable by AI assistants (Claude Code, etc.)
- Supports stdio (local) and HTTP transports
- Bearer-token authenticated

### Backend

- **Supabase Postgres** — all page data persisted with RLS policies
- **Supabase Storage** — image uploads for covers and inline media
- **Optimistic updates** — UI updates instantly, Supabase sync runs in background
- **Slug redirect** — `/s/:slug` resolves via server-side lookup

---

## Tech Stack

| Layer          | Technology                       |
| -------------- | -------------------------------- |
| Frontend       | React 18 + TypeScript + Vite 5   |
| Routing        | React Router v6                  |
| Editor         | BlockNote 0.47                   |
| Drag & drop    | dnd-kit                          |
| Backend        | Supabase (Postgres + Storage)    |
| Styling        | Tailwind CSS                     |
| Typography     | Commissioner (UI), [Coiny](https://fonts.google.com/specimen/Coiny?categoryFilters=Feeling:%2FExpressive%2FCute) (brand), [Google Sans Code](https://fonts.google.com/specimen/Google+Sans+Code) (code) via Google Fonts |
| Testing        | Vitest + Testing Library         |
| AI Integration | Model Context Protocol (MCP) SDK |
| Deploy         | Vercel                           |

---

## Architecture Highlights

- **Context-based theme** — `ThemeContext` wraps the entire app so toggling theme anywhere (sidebar, mobile header) instantly updates BlockNote's color scheme via CSS variable overrides — no prop drilling
- **Shared editor schema** — a single `BlockNoteSchema` instance defines all block types and is reused in both the editable and read-only views
- **Optimistic page tree** — `WorkspaceContext` holds all page state; mutations update local state immediately and sync to Supabase in the background, reverting on failure
- **Block sanitizer** — a custom `sanitizeBlocks` utility migrates legacy table block formats to BlockNote 0.47's `tableContent` structure on load
- **Error boundary** — wraps BlockNote initialization; if block content is malformed, falls back to a fresh empty editor without crashing
- **MCP server** — a separate Express/Hono server exposing workspace content as MCP tools, deployed as a Vercel serverless function alongside the frontend

---

## Project Structure

```
src/
├── components/
│   ├── auth/           # Lock screen
│   ├── editor/         # BlockNote integration, custom blocks, editor theme CSS
│   ├── page/           # EditorPage, PageHeader, Breadcrumb, EmptyState, SlugModal
│   ├── sidebar/        # Sidebar, SortablePageList, PageTreeItem
│   └── ui/             # Button, IconButton, InlineInput, ConfirmModal, EmojiPicker
├── context/
│   ├── WorkspaceContext.tsx   # Global page state + Supabase sync
│   └── ThemeContext.tsx       # Shared dark/light theme state
├── lib/
│   ├── pageRepo.ts     # Supabase page CRUD
│   ├── storageRepo.ts  # Supabase Storage uploads
│   ├── sanitizeBlocks.ts  # Block migration utility
│   ├── page-utils.ts   # Tree building, breadcrumbs (pure functions)
│   └── drag-utils.ts   # Sidebar reorder logic
├── hooks/
│   ├── usePages.ts     # In-memory page state hook
│   └── useIsMobile.ts  # Responsive breakpoint hook
├── pages/
│   ├── WorkspacePage.tsx    # Main layout (sidebar + editor)
│   ├── ReadOnlyPage.tsx     # Public read-only viewer
│   └── SlugRedirectPage.tsx # /s/:slug resolver
└── types/
    └── index.ts        # Page, CreatePageInput, UpdatePageInput

mcp/                    # MCP server (AI assistant integration)
scripts/                # DB migration utilities
api/                    # Vercel serverless functions
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
git clone <repo-url>
cd logblock
npm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Supabase Schema

```sql
create table pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  parent_id uuid references pages(id) on delete cascade,
  title text not null default 'Untitled',
  icon text,
  cover_image_url text,
  cover_image_position numeric default 50,
  body jsonb,
  slug text unique,
  order_index integer not null default 0,
  is_deleted boolean not null default false,
  created_by text not null default 'anonymous',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger pages_updated_at
  before update on pages
  for each row execute function set_updated_at();

-- Storage bucket
insert into storage.buckets (id, name, public) values ('mylogblock', 'mylogblock', true);

-- RLS (single-user workspace — anon access)
alter table pages enable row level security;
create policy "anon read"   on pages for select using (true);
create policy "anon insert" on pages for insert with check (true);
create policy "anon update" on pages for update using (true);
create policy "anon delete" on pages for delete using (true);

create policy "anon storage read"   on storage.objects for select using (bucket_id = 'mylogblock');
create policy "anon storage insert" on storage.objects for insert with check (bucket_id = 'mylogblock');
```

---

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # TypeScript check + production build
npm run preview       # Preview production build locally
npm test              # Run test suite
npm run test:watch    # Watch mode
npm run type-check    # TypeScript check only
npm run lint          # ESLint
```

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_ACCESS_CODE`
4. Deploy — `vercel.json` SPA rewrite is already configured

---

## License

MIT
