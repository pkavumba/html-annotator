import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const extensionRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = resolve(extensionRoot, "dist");

if (process.argv[2] === "clean") {
  await rm(outputDirectory, { recursive: true, force: true });
} else {
  await mkdir(outputDirectory, { recursive: true });
  await build({
    entryPoints: [resolve(extensionRoot, "src/content.js")],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome110",
    loader: { ".css": "text" },
    outfile: resolve(outputDirectory, "content.js"),
    legalComments: "eof",
  });
}
