import path from "node:path";

import { defineConfig } from "vite";

import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react-swc";
import { externalizeDeps } from "vite-plugin-externalize-deps";

export default defineConfig({
  plugins: [
    react(),
    externalizeDeps(),
    dts({ tsconfigPath: "./tsconfig.app.json" }),
  ],
  build: {
    lib: {
      fileName: "index",
      formats: ["es", "cjs"],
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
    },
  },
});
