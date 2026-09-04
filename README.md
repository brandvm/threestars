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

`dist/` is gitignored for day-to-day work and rebuilt by CI on every push.
A release is the one time it gets committed, and that takes `git add -f`
— see [Releasing](#releasing).

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

Production is pinned to a jsDelivr tag, so a staging deploy never touches
the live site.

## Releasing

Production serves `dist/` out of a git tag via jsDelivr, so the built
files have to be committed before the tag is cut:

```bash
pnpm build
git add -f dist && git commit -m "release: vX.Y.Z"
git tag vX.Y.Z && git push && git push --tags
git rm -r --cached dist && git commit -m "chore: untrack dist after vX.Y.Z"
git push
```

`dist/` is gitignored for day-to-day work, so the `-f` is required —
without it the release commit is empty, the tag carries no build, and
jsDelivr serves a 404 to the live site.

The last two lines put it back. `.gitignore` only applies to files git is
not already tracking, so the release commit makes `dist/` tracked and the
ignore rule stops having any effect on it — from then on every rebuild
shows up as a modification and rides along with the next `git add .`,
quietly parking a minified bundle inside unrelated commits.
`git rm --cached` un-tracks it while leaving the files on disk. The tag
still points at the commit that contains the build, so jsDelivr is
unaffected; only what `master` tracks going forward changes.

Then bump `VER` in the Webflow snippets (see [`loader.html`](loader.html))
and publish. Rollback is reverting those version strings.

Three rules:

- `dist/` must be committed **before** the tag is pushed. A tag without it
  makes every pinned production URL 404.
- A pushed tag must **never** be moved with `tag -f`. jsDelivr snapshots a
  version once and keeps it forever, so a half-baked snapshot is permanent.
  Botched a release? Cut the next patch version instead.
- Un-track `dist/` again once the tag is pushed, or the ignore rule stays
  dead for every commit after the first release.

Never point production at `@latest` or a branch URL.

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
