import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The deck must run from a file:// URL with no network, so every asset
// (fonts, anime.js, CSS, JS) is inlined into a single index.html.
export default defineConfig({
  root: __dirname,
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Inline every asset regardless of size (fonts are ~24kB each).
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    target: "es2020",
    reportCompressedSize: true,
  },
  plugins: [
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
});
