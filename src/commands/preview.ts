import { defineCommand } from "citty";
import { info, success, error } from "../utils/logger";
import { resolve, join } from "path";
import { readFileSync, existsSync } from "fs";
import { createServer } from "http";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getMimeType(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf("."));
  return MIME_TYPES[ext] || "application/octet-stream";
}

export default defineCommand({
  meta: {
    name: "preview",
    description: "Preview the landing page locally in your browser",
  },
  args: {
    port: {
      type: "string",
      alias: "p",
      default: "3000",
      description: "Port to serve on (default: 3000)",
    },
  },
  async run({ args }) {
    const docsDir = resolve(import.meta.dirname ?? ".", "..", "..", "docs");

    if (!existsSync(docsDir)) {
      error("docs/ directory not found. Nothing to preview.");
      process.exit(1);
    }

    const indexPath = join(docsDir, "index.html");
    if (!existsSync(indexPath)) {
      error("docs/index.html not found. Nothing to preview.");
      process.exit(1);
    }

    const port = parseInt(args.port as string, 10) || 3000;

    const server = createServer((req, res) => {
      const url = req.url === "/" ? "/index.html" : req.url || "/index.html";
      const filePath = join(docsDir, url);

      // Prevent directory traversal
      if (!filePath.startsWith(docsDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      try {
        const content = readFileSync(filePath);
        res.writeHead(200, { "Content-Type": getMimeType(filePath) });
        res.end(content);
      } catch {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    });

    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      success(`Landing page preview running at ${url}`);
      info("Press Ctrl+C to stop the server");
    });

    // Keep the process alive
    await new Promise(() => {});
  },
});
