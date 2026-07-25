// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, componentTagger (dev-only),
//     VITE_* env injection, @ path alias, React/TanStack dedupe, error logger plugins,
//     and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// wrangler.jsonc main alone is insufficient — the plugin needs to know to build this file.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    router: { autoCodeSplitting: true },
  },
  // Outside the Lovable sandbox the nitro deploy plugin is skipped by default, which left
  // `vite build` emitting raw dist/client + dist/server with no host adapter — Vercel had
  // nothing in .vercel/output to serve, hence 404s on every route in production. Force it on
  // with the vercel preset so the build itself produces Vercel's Build Output API format.
  // The output paths must be overridden back to the vercel preset's own defaults: this
  // wrapper's base config otherwise hardcodes dist/client + dist/server (the cloudflare-module
  // layout wrangler.jsonc expects), which isn't where Vercel's build step looks for output.
  nitro: {
    preset: process.env.NITRO_PRESET ?? "vercel",
    output: {
      dir: "{{ rootDir }}/.vercel/output",
      serverDir: "{{ output.dir }}/functions/__server.func",
      publicDir: "{{ output.dir }}/static/{{ baseURL }}",
    },
  },
  vite: {
    build: {
      target: "es2018",
      cssTarget: "chrome61",
    },
  },
});
