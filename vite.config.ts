import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { imagetools } from "vite-imagetools";
import { compression } from "vite-plugin-compression2";
import { createHtmlPlugin } from "vite-plugin-html";
// Copy strings injected into index.html at build time.
// Kept in sync with src/i18n/locales/de.json (meta section).
const meta = {
  title: "Krypto Harry – Bitcoin Mining am Handy",
  description:
    "Starte mit Bitcoin-Mining – ohne technisches Setup. Hol dir dein kostenloses 1:1 Strategie-Gespräch mit dem Krypto Harry Team.",
  ogTitle: "Krypto Harry – Bitcoin Mining am Handy",
  ogDescription: "Kostenloses Strategie-Gespräch: Bitcoin-Mining ohne Fachwissen.",
};
// https://viteplus.dev/config/ — Vite+ extends Vite's config shape.
export default defineConfig({
  base: "/KryptoHarry/",
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [
    react(),
    tailwindcss(),
    imagetools(),
    createHtmlPlugin({
      minify: true,
      inject: { data: meta },
    }),
    // Pre-compress dist/ so Vercel serves the Brotli/gzip artifact directly.
    compression({
      algorithms: ["brotliCompress", "gzip"],
      exclude: [/\.(br|gz)$/],
    }),
  ],
  build: {
    target: "es2022",
    cssCodeSplit: true,
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
  },
});
