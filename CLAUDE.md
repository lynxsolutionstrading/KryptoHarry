# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

German-language single-page conversion funnel for **Krypto Harry** — Bitcoin-mining
consulting. Every CTA drives the visitor to a Telegram chat. Hosted on Vercel.

## Toolchain — Vite+, not stock Vite

The build pipeline is **Vite+ (`vite-plus` / VoidZero)**, a unified `vp` CLI that wraps
dev / build / lint / format / typecheck. Do **not** invoke `eslint`, `prettier`,
`tsc --noEmit`, or `vite` directly — go through pnpm scripts so the project's `vp`
config in [vite.config.ts](vite.config.ts) (`fmt: {}`, `lint: { typeAware, typeCheck }`) is honored:

| Command              | Runs                                                          |
| -------------------- | ------------------------------------------------------------- |
| `pnpm dev`           | `vp dev` — HMR at http://localhost:5173                       |
| `pnpm build`         | `tsc -b` (project refs) → `vp build` → pre-compressed `dist/` |
| `pnpm preview`       | Serve built `dist/` locally                                   |
| `pnpm check`         | Format + lint + typecheck in one pass                         |
| `pnpm lint`          | Lint only (type-aware)                                        |
| `pnpm fmt`           | Format only                                                   |
| `pnpm optimize-logo` | Regenerate AVIF/WebP/PNG from `design-source/` (see below)    |

`pnpm-workspace.yaml` uses a **catalog** that pins `vite` and `vitest` to
`@voidzero-dev/vite-plus-*`. Don't bump those without updating the catalog entry.

There is no test runner wired in. `tsc -b` is the only pre-build check (see
`tsconfig.app.json` + `tsconfig.node.json` — composite project references).

## Architecture in one paragraph

[src/App.tsx](src/App.tsx) composes ~10 section components top-to-bottom — there's no
router. Every visible string lives in [src/i18n/locales/de.json](src/i18n/locales/de.json)
and is reached via `import t from "./i18n"` (the type comes from the JSON itself, so
adding a key gives instant type-safe access via `t.problem.cards[0].title`). Three
shared hooks in [src/hooks/](src/hooks/) drive all motion:
[useFadeUp.ts](src/hooks/useFadeUp.ts) (IntersectionObserver → `.visible` class),
[useScrollY.ts](src/hooks/useScrollY.ts) (writes `--scroll-y` CSS var for parallax),
[useTilt.ts](src/hooks/useTilt.ts) (pointer → `--tilt-x/-y/--mx/--my`). All three
short-circuit on `prefers-reduced-motion`, and `useTilt` also skips touch devices.

## Styling — Tailwind v4 with no config file

There is no `tailwind.config.*`. All design tokens and project utilities live in the
`@theme` and `@utility` blocks of [src/styles/global.css](src/styles/global.css):

- **Tokens** (`@theme`): `--color-bg/surface/surface-2/3`, `--color-gold[-light/-dark]`,
  `--font-display` (Bebas Neue) / `--font-sans` (DM Sans), radii. Add new colors here,
  not inline.
- **Named utilities** (`@utility`): `section-shell`, `section-inner`, `eyebrow`,
  `h2-display`, `lead`, `fade-up`, `hero-glow`, `cta-glow`, `cta-primary`,
  `cta-sticky`, `btn-shine`, `tilt-card`, `tilt-spot`, `press-ticker-*`, etc.
  Components compose these with Tailwind atomic classes — both work in the same
  `className`.
- The README mentions "plain CSS Modules"; that's stale. There are no `.module.css`
  files — everything is Tailwind v4 + the utilities above.

Fonts are self-hosted via `@fontsource*` (imported once in [main.tsx](src/main.tsx) —
ship only the weights actually used).

## Non-obvious conventions

**The sticky CTA depends on `data-primary-cta`.** [StickyCta.tsx](src/components/StickyCta.tsx)
queries all `[data-primary-cta]` elements at mount and hides itself whenever any of
them is ≥40 % in view (so the floating CTA only appears in the gaps between in-page
CTAs). Any new primary call-to-action must carry that attribute.

**`useScrollY` only updates three specific selectors.** To avoid full-page style
recalculation on every scroll frame, it queries
`.hero-glow, .bitcoin-watermark, .star-field__parallax` and writes `--scroll-y` only
on those. New parallax elements need their selector added to the list in
[useScrollY.ts](src/hooks/useScrollY.ts).

**StarField is visibility-culled.** [StarField.tsx](src/components/StarField.tsx)
observes its parent `<section>` / `<footer>` and only mounts the star nodes when the
section is within 240 px of the viewport. Cheap idle, no popping.

**Meta tags are duplicated.** Page title/description live in **both**
[vite.config.ts](vite.config.ts) (`meta` object injected via `vite-plugin-html`) and
[src/i18n/locales/de.json](src/i18n/locales/de.json) (`meta` block). Keep them in
sync — there's a comment in `vite.config.ts` flagging this.

**Pre-compression is part of deploy.** `vite-plugin-compression2` emits `.br` and
`.gz` alongside every dist asset, and [vercel.ts](vercel.ts) sets immutable
`Cache-Control` on `/assets/*` and fingerprinted fonts/images so Vercel serves the
pre-compressed artifact directly. Don't remove either half without updating the other.
`vercel.ts` is **typed** Vercel config (`@vercel/config`) — it replaces `vercel.json`.

**Performance budget (gzipped, enforced manually via `pnpm build`):** JS ≤ 80 KB,
CSS ≤ 15 KB, logo ≤ 20 KB, **total ≤ 150 KB**. Keep an eye on dep size before adding
anything.

## Env vars

Override in `.env.local` (gitignored). Read by [src/lib/config.ts](src/lib/config.ts):

| Var                       | Purpose                                                    | Default                    |
| ------------------------- | ---------------------------------------------------------- | -------------------------- |
| `VITE_TELEGRAM_URL`       | Telegram link every CTA points to                          | `https://t.me/kryptoharry` |
| `VITE_VSL_URL`            | Hero video embed URL (empty → show poster + play button)   | _(empty)_                  |
| `VITE_ENABLE_ANALYTICS`   | `1` or `true` → load Vercel Analytics + Speed Insights     | _(off)_                    |

Note: the README still calls this var `VITE_ANALYTICS_ENABLED` — the code uses
`VITE_ENABLE_ANALYTICS`. The code wins.

## Images / assets

The hero logo ships in three sizes × three formats. Source PNG lives in
`design-source/` (gitignored). To regenerate after editing the source:

```bash
pnpm optimize-logo
```

This runs [scripts/optimize-logo.mjs](scripts/optimize-logo.mjs) via Sharp and writes
to `src/assets/logo-{400,800}.{avif,webp,png}`. The same pattern (`<picture>` with
AVIF → WebP → PNG fallback) is used in [Hero.tsx](src/components/Hero.tsx) and
[Footer.tsx](src/components/Footer.tsx). `vite-imagetools` is also installed for
query-string image transforms if needed inline.

Press-logo SVG/PNG/WebP assets in `src/assets/press/` feed the marquee in
[Hero.tsx](src/components/Hero.tsx); items flagged with `invert: true` get a CSS
`filter: invert(1)` so dark logos render correctly on the dark bg.
