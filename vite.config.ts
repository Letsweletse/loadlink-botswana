import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  build: {
    target: ["es2018", "chrome61", "safari13"],
    cssTarget: ["chrome61", "safari13"],
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          tanstack: ["@tanstack/react-query", "@tanstack/react-router"],
          charts: ["recharts"],
        },
      },
    },
  },
});
