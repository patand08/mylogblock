# LogBlock MCP Server

A Model Context Protocol (MCP) server that exposes LogBlock pages to AI agents via Claude or Composio.

---

## Available Tools

| Tool | Description |
|---|---|
| `list_pages` | Flat list of all pages (id, title, icon, parent, slug, order) |
| `get_page_tree` | All pages as a nested hierarchy |
| `get_page` | Single page with full body content (BlockNote JSON) |
| `get_page_by_slug` | Find a page by its custom URL slug |
| `create_page` | Create a new page (title, parent, icon, body) |
| `update_page` | Update title, icon, body, cover image, or slug |
| `delete_page` | Soft-delete a page and optionally its subpages |
| `search_pages` | Find pages by title keyword |
| `set_page_slug` | Set or clear the custom URL slug on a page |

---

## Architecture

The MCP server is **deployed as part of the main LogBlock Vercel app** — not as a separate service.

```
logblock/
├── api/
│   └── mcp.ts          ← Vercel serverless function (the live MCP endpoint)
├── mcp/
│   ├── src/            ← TypeScript source (server logic, auth, validation, types)
│   └── MCP.md          ← This file
└── vercel.json         ← Routes /api/* to serverless functions
```

When Vercel builds and deploys the app, `api/mcp.ts` is automatically compiled and served at:

```
https://<your-vercel-domain>/api/mcp
```

The standalone `mcp/` folder contains the shared source logic (`src/server.ts`, `src/auth.ts`, etc.) that `api/mcp.ts` imports. There is no separate Railway/Render deployment needed.

---

## Deploy to Vercel

### 1. Push to GitHub

Everything is in the same repo. Just push normally — Vercel picks it up automatically:

```bash
git add .
git commit -m "..."
git push
```

### 2. Set environment variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://yrysnwhoyesrpylvdmyw.supabase.co` |
| `SUPABASE_SERVICE_KEY` | *(Supabase → Settings → API → service_role key)* |
| `LOGBLOCK_WORKSPACE_ID` | `local-workspace` |
| `MCP_API_KEY` | *(your generated secret key — see below)* |

> `PORT` and `MCP_TRANSPORT` are **not needed** for Vercel — those are only used by the standalone local/Railway server.

To generate a secure `MCP_API_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Confirm it's live

After deploy, check the health-like probe (the `/api/mcp` route only accepts POST, so a GET returns 405 — that means it's up):

```bash
curl -X POST https://<your-vercel-domain>/api/mcp \
  -H "Authorization: Bearer YOUR_MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

You should get back a JSON list of all 9 tools.

---

## Local Development

For local development you can still run the standalone server from `mcp/`:

### 1. Install and configure

```bash
cd mcp
npm install
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://yrysnwhoyesrpylvdmyw.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
LOGBLOCK_WORKSPACE_ID=local-workspace
MCP_TRANSPORT=http
PORT=3333
MCP_API_KEY=your-secret-key
```

### 2. Build and run

```bash
npm run build
npm start
# → LogBlock MCP server running on port 3333
```

Test it:
```bash
curl http://localhost:3333/health
# {"status":"ok","service":"logblock-mcp"}
```

---

## Connect to Claude Code (local stdio)

For local use with Claude Code, run in stdio mode:

```bash
# In mcp/.env, set:
MCP_TRANSPORT=stdio
```

Build then register:

```bash
cd mcp && npm run build
claude mcp add logblock -e SUPABASE_URL=https://... -e SUPABASE_SERVICE_KEY=... -e MCP_TRANSPORT=stdio -- node /absolute/path/to/logblock/mcp/dist/index.js
```

Restart Claude Code — LogBlock tools will appear in the tool list.

---

## Connect to Composio

1. In Composio, go to **Tools → Custom MCP**
2. Add a new server:
   - **Name:** `LogBlock`
   - **URL:** `https://<your-vercel-domain>/api/mcp`
   - **Auth type:** Bearer Token
   - **Token:** your `MCP_API_KEY` value
3. Click **Connect** — Composio will discover all 9 tools automatically

---

## Security Notes

- **Never commit `.env`** — it's in `.gitignore`
- Every `/api/mcp` POST must include `Authorization: Bearer <MCP_API_KEY>`
- Use the **service role key** for `SUPABASE_SERVICE_KEY` — it bypasses RLS and must never reach the frontend
- The Vercel function validates the API key before touching Supabase