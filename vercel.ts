import { routes, type VercelConfig } from "@vercel/config/v1";

// https://vercel.com/docs/project-configuration/vercel-ts
// Typed Vercel config — replaces vercel.json.
export const config: VercelConfig = {
  framework: "vite",
  // Build via Vite+ so format/lint/typecheck are honored by the project scripts.
  buildCommand: "pnpm build",
  outputDirectory: "dist",
  // Long-lived cache for fingerprinted assets. Vite hashes everything in /assets/,
  // so we can safely mark them immutable.
  headers: [
    routes.cacheControl("/assets/(.*)", {
      public: true,
      maxAge: "1year",
      immutable: true,
    }),
    // Fonts/images at the root are also fingerprint-friendly once imported through Vite.
    routes.cacheControl("/(.*)\\.(woff2|webp|avif|svg)", {
      public: true,
      maxAge: "1year",
      immutable: true,
    }),
  ],
};

export default config;
