import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "../mcp/src/server.js";
import { checkApiKey } from "../mcp/src/auth.js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? "";
const WORKSPACE_ID = "local-workspace";
const MCP_API_KEY = process.env.MCP_API_KEY ?? "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method?.toUpperCase();

  // GET for health check / browser requests
  if (method === "GET") {
    res.status(200).json({ status: "ok", method: "GET", purpose: "health check" });
    return;
  }

  // POST for MCP streaming protocol
  if (method === "POST") {
    if (!MCP_API_KEY) {
      res.status(500).json({ error: "Server misconfigured: missing MCP_API_KEY" });
      return;
    }

    // Auth check
    if (!checkApiKey(req.headers.authorization, MCP_API_KEY)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate env
    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: "Server misconfigured: missing Supabase credentials" });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const server = buildServer(supabase as never, WORKSPACE_ID);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on("close", () => server.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // PUT for resource updates (not supported on streaming MCP endpoint)
  if (method === "PUT") {
    res.status(405).json({
      error: "Method not allowed",
      message: "PUT is not supported on the MCP streaming endpoint",
      supportedMethods: ["GET", "POST"],
    });
    return;
  }

  // PATCH for partial updates (not supported on streaming MCP endpoint)
  if (method === "PATCH") {
    res.status(405).json({
      error: "Method not allowed",
      message: "PATCH is not supported on the MCP streaming endpoint",
      supportedMethods: ["GET", "POST"],
    });
    return;
  }

  // DELETE for resource deletion (not supported on streaming MCP endpoint)
  if (method === "DELETE") {
    res.status(405).json({
      error: "Method not allowed",
      message: "DELETE is not supported on the MCP streaming endpoint",
      supportedMethods: ["GET", "POST"],
    });
    return;
  }

  // Catch-all for any other unsupported methods
  res.status(405).json({
    error: "Method not allowed",
    message: `${method} is not a supported HTTP method for this endpoint`,
    supportedMethods: ["GET", "POST"],
  });
}
