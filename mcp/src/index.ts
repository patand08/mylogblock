import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createClient } from "@supabase/supabase-js";
import express from "express";
import { buildServer } from "./server.js";
import { checkApiKey } from "./auth.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const WORKSPACE_ID = process.env.MYLOGBLOCK_WORKSPACE_ID ?? "local-workspace";
const transport = process.env.MCP_TRANSPORT ?? "http";

if (transport === "stdio") {
  const server = buildServer(supabase as never, WORKSPACE_ID);
  await server.connect(new StdioServerTransport());
} else {
  const PORT = parseInt(process.env.PORT ?? "3333");
  const MCP_API_KEY = process.env.MCP_API_KEY;

  if (!MCP_API_KEY) {
    console.error("Missing MCP_API_KEY env var — refusing to start without auth");
    process.exit(1);
  }

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "mylogblock-mcp" });
  });

  app.post("/mcp", async (req, res) => {
    if (!checkApiKey(req.headers.authorization, MCP_API_KEY)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const server = buildServer(supabase as never, WORKSPACE_ID);
    const mcpTransport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => server.close());
    await server.connect(mcpTransport);
    await mcpTransport.handleRequest(req, res, req.body);
  });

  app.listen(PORT, () => {
    console.log(`MyLogBlock MCP server running on port ${PORT}`);
  });
}
