#!/usr/bin/env node
/**
 * Zero-dependency static server for the deck.
 *
 * Lets you present straight from a clean clone with no `npm install`:
 *   node tools/serve.js [port]
 *
 * You do not need this to view the deck — index.html opens directly from disk.
 * It is only useful if you want a real http:// origin (for DevTools features
 * that file:// restricts, or to view the deck from a phone on the same wifi).
 */

const { createServer } = require("node:http");
const { readFile, stat } = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/" || rel.endsWith("/")) rel += "index.html";

    // Contain every request inside ROOT — no path traversal.
    const abs = path.join(ROOT, path.normalize(rel));
    if (!abs.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const info = await stat(abs).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: ${rel}`);
      return;
    }

    const body = await readFile(abs);
    res.writeHead(200, {
      "content-type": MIME[path.extname(abs).toLowerCase()] || "application/octet-stream",
      "content-length": body.length,
      "cache-control": "no-cache",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`500 Internal Server Error\n${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`\n  Cloud Storage Presentation`);
  console.log(`  → http://localhost:${PORT}\n`);
  console.log(`  Press ? in the deck for keyboard shortcuts. Ctrl+C to stop.`);
  console.log(`  (Not required — you can also just open index.html directly.)\n`);
});
