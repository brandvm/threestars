# Three Stars Capital Partners

Custom CSS and JavaScript for the Three Stars Capital Partners Webflow
site. Design tokens live in Webflow Variables; this repo owns
tokens-as-CSS, resets, utilities and JS-paired styles, and ships them to
the page through a CDN.

The Webflow Designer owns layout and classes. Nothing in this repo
generates markup.

## Requirements

- [Node](https://nodejs.org) 22 (the version CI builds with)
- [pnpm](https://pnpm.io/installation) 11

```bash
corepack enable
pnpm install
```

## Commands

```bash
pnpm dev      # esbuild watch + server on :3000 (unminified, sourcemaps)
pnpm build    # minified -> dist/
pnpm check    # tsc --noEmit
```

## How the build works

`build.mjs` drives esbuild directly — there is no framework and no config
file. Two entry points are bundled:

| Source            | Output             |
| ----------------- | ------------------ |
| `src/index.ts`    | `dist/index.js`    |
| `src/styles.css`  | `dist/styles.css`  |

`pnpm dev` adds three things on top of a normal build: watch mode,
a CORS-open static server on `http://localhost:3000`, and a small banner
script that opens an `EventSource` to `/esbuild` and reloads the page on
rebuild. Live reload works in the browser; it does **not** work on the
Designer canvas, which never runs scripts.

`dist/` is gitignored and rebuilt on every push.

## How the files reach the page

Three snippets are pasted into Webflow — head code, an Embed on the
canvas, and footer code. They are documented in
[`loader.html`](loader.html); read that file before touching any of them.

Which build the page loads depends on where it is running:

| Environment      | Source                        |
| ---------------- | ----------------------------- |
| Production       | pinned jsDelivr tag           |
| `*.webflow.io`   | GitHub Pages staging          |
| `?bv-dev=1`      | `http://localhost:3000`       |

## Deployment

Pushing to `master` triggers
[`.github/workflows/staging.yml`](.github/workflows/staging.yml), which
runs `pnpm build` and publishes `dist/` to GitHub Pages. That is the
staging URL the `*.webflow.io` site loads.

Production is pinned to a jsDelivr tag, so a staging deploy does not
touch the live site — cutting a release means tagging the repo and
bumping `VER` in `loader.html`.

## Project structure

```
src/
  index.ts            entry point; imports and starts the modules
  styles.css          the whole stylesheet, in numbered sections
  modules/
    clock.ts
    region-map.ts
    smooth-scroll.ts
    year.ts
build.mjs             esbuild config and dev server
loader.html           the three Webflow snippets, documented
CLAUDE.md             token architecture, Webflow gotchas, open decisions
```

`src/styles.css` is organised into numbered sections with a table of
contents at the top; keep additions inside the section they belong to.

TypeScript runs `strict`, targets ES2019, and defines no path aliases —
imports are relative.

## Further reading

[`CLAUDE.md`](CLAUDE.md) documents the token architecture, the Webflow
Designer gotchas that have already cost time, and the open decisions
still outstanding. It is worth reading before making a change to either
the tokens or the loader.
