# Gotchas

A running log of things that cost time on this project. Agents read it at
the start of every session and add to it when they hit something new (see
the Session protocol in `AGENTS.md`). Never delete an entry — update its
`Status` instead.

Entries tagged `Scope: template-candidate` are harvested across all client
repos to improve `brandvm/wf-template`.

## Entry format

```md
### YYYY-MM-DD · Short title
- Area: designer | css | loader | release | mcp | ci | js | perf
- Scope: project | template-candidate
- Symptom: what was observed
- Cause: why it happened
- Fix: what was done, or the workaround
- Status: open | fixed <sha> | upstreamed wf-template <sha>
- Found by: claude | codex | human
```

## This project

<!-- Add new entries here, newest first. -->

### 2026-09-16 · Locking scroll on body un-sticks the header
- Area: css
- Scope: template-candidate
- Symptom: On a scrolled page (always the case when arriving with a #hash)
  the open mobile menu started above the viewport and only the
  bottom-pinned Contact button showed.
- Cause: `html.is-nav-open` set `overflow: hidden` on html *and* body, which
  makes body its own scroll container; the sticky header then sticks to
  body, which never scrolls, so it sat at the document top off-screen and
  `--nav-menu-top` read a negative edge. An earlier override forcing
  `position: relative` on the open header had the same effect (d578024).
- Fix: lock html only, drop the `position: relative` override, clamp
  `--nav-menu-top` at 0 (eb39e35, d578024).
- Status: fixed eb39e35
- Found by: claude

### 2026-09-16 · Finsweet List init() wraps lists twice
- Area: js
- Scope: template-candidate
- Symptom: Risk of every `[fs-list-element="list"]` being wrapped twice when
  more than one module started Finsweet List.
- Cause: `init()` wraps every marked list it finds, so each caller re-wraps.
- Fix: `finsweet-list.ts` owns the one init per page through a shared
  `startLists()` promise; `initLists()` runs after the page modules because
  they set attributes `init()` must see (b919996). Never call `init()`
  elsewhere.
- Status: fixed b919996
- Found by: claude

### 2026-09-16 · Webflow's anchor scroll ignores the sticky header
- Area: js
- Scope: template-candidate
- Symptom: Same-page hash links landed flush to the top, under `.nav-w`.
- Cause: Webflow's `scroll` module offsets only for a `position: fixed`
  header and never reads `scroll-margin-top`. `.nav-w` is a sticky
  `<header>`.
- Fix: `anchor-scroll.ts` unbinds it (`click.wf-scroll`), scrolls through
  Lenis, and measures `--nav-h` from `.nav-w` with a ResizeObserver. Do not
  reintroduce a hard-coded nav height, and do not add a second hash-link
  handler (cf0eae9).
- Status: fixed cf0eae9
- Found by: claude

### 2026-09-09 · MCP cannot set form placeholders or select choices
- Area: mcp
- Scope: template-candidate
- Symptom: Native placeholders and `<select>` options on the Contact form
  could not be set through the Webflow MCP.
- Cause: MCP limitation.
- Fix: `contact-form.ts` reads `data-contact-placeholder` on inputs and the
  pipe-separated `data-contact-subject` on the select; edit those attributes
  in the Designer (49d479d, README "Contact form"). Related: conditional
  visibility on the bio modal LinkedIn row is rejected as "not inside a CMS
  context" (47ad8a4) — set it in the Designer.
- Status: worked around
- Found by: human

### 2026-09-04 · `.map-layer` mask and background are gone on purpose
- Area: designer
- Scope: project
- Symptom: The map class looks like something was tidied away by accident.
- Cause: `region-map.ts` fetches the SVG named by `data-map-src`, inlines it
  and frames it with `viewBox`; as a CSS mask it was a raster that no zoom
  budget could keep sharp at 280% on a phone (4acdb7a, 13a3f67, 16cf5b1).
- Fix: do not put them back. Re-adding the background paints a solid block
  behind the vector; re-adding the mask pulls 570KB during page load, which
  the idle fetch exists to avoid. Both go back on automatically, inline,
  only if the fetch fails (106a1a2).
- Status: documented
- Found by: claude

### 2026-09-04 · A variable mode does not apply variables
- Area: designer
- Scope: template-candidate
- Symptom: Text inside a dark-mode section keeps the light-mode colour;
  `currentColor` and every `u-muted-*` built on it stay wrong.
- Cause: A mode only changes what variables resolve to. `color` is inherited
  and was already computed on `body`.
- Fix: any class that sets a Colors Semantic mode **must also declare
  `color`**. `.is-dark` is the reference (a4f8a6d, former CLAUDE.md).
- Status: documented
- Found by: claude

### 2026-09-04 · Layout tokens are `em` and render 6.25% short
- Area: css
- Scope: project
- Symptom: `Container/Max Width: 80em` renders 1200px where Figma wants
  1280px; gutters 75px vs 80px.
- Cause: Body is `Size/Body` → `Size/15` = `0.9375em`, so 1em is 15px, not
  16. Values authored as Figma-px ÷ 16 undershoot.
- Fix: none yet. Keep the `em` convention and account for the element's
  inherited font size when matching design dimensions (a4f8a6d, AGENTS.md
  Open decisions).
- Status: open
- Found by: claude

### 2026-09-03 · Container neutralizer ate Designer max-widths
- Area: css
- Scope: template-candidate
- Symptom: S Wrapper's `Container/Max Width` token never reached the page at
  any breakpoint.
- Cause: `.w-layout-blockcontainer { max-width: none }` and the Designer
  class are both 0-1-0; this sheet loads after Webflow's, so the neutralizer
  won on source order. `:where()` cannot fix it — it hands Webflow's 940px
  cap back.
- Fix: scoped (b5f122c), then dropped (89e7510), then replaced with
  `max-width: var(--_layout---container--max-width, none)` (bca58fb). That
  rule now references a Webflow variable name: renaming the Layout
  collection, Container group or Max Width variable degrades every bare
  Container to uncapped, silently. Width variants must be combo classes.
- Status: open (variable reference remains in §03)
- Found by: claude

## Known from previous projects

Inherited from `wf-template`. Found across earlier client repos; listed so
they are not rediscovered. Status refers to the template.

### 2026-10-02 · Neutralizers in §03 override Designer styles
- Area: css
- Scope: template-candidate
- Symptom: A style changed in the Designer has no effect on the page.
- Cause: `src/styles.css` loads after `webflow.css`, so the §03 `.w-*` rules
  win same-specificity ties by source order. `.w-layout-blockcontainer
  { max-width }` silently overrode Designer container caps (threestars
  b5f122c); the `.w-dropdown-toggle` reset broke Webflow's chevron spacing
  (reformdd 8c65a5c).
- Fix: reformdd removed ten neutralizers so "Webflow's own defaults now stand
  unopposed" (c2e5f4b). Delete a neutralizer the moment it fights the
  Designer.
- Status: open
- Found by: human

### 2026-10-02 · Root font-size scale drifts from Designer tokens
- Area: css
- Scope: template-candidate
- Symptom: Designer variables named for px values ("Max Width - 1280px")
  render at different sizes; the scale is retuned again and again.
- Cause: The §01 fluid scale sets `:root` font-size, so every rem/em value
  coming out of the Designer scales with it. reformdd retuned it seven times
  (1680 → 1440 → 1680 → clamp → revert → 1920 → 1440); threestars found em
  layout tokens rendering 6.25% short.
- Fix: none general. Agree the scale with the designer before building, or
  drop it and let Webflow variables own sizing.
- Status: open
- Found by: human

### 2026-10-02 · Renaming a Webflow variable silently breaks repo CSS
- Area: css
- Scope: template-candidate
- Symptom: A container cap or token-driven value quietly stops applying.
- Cause: Container/Max Width was renamed to Section/Max Width in Webflow.
  Webflow rewrites its own references but cannot reach this bundle, so
  `var(--_layout---container--max-width, none)` fell back to `none`
  (reformdd 1ca59f6).
- Fix: avoid referencing Webflow variable names in repo CSS; if one is
  needed, log it here so renames get checked.
- Status: open
- Found by: human

### 2026-10-02 · Removing a rule locally does not remove it on the canvas
- Area: designer
- Scope: template-candidate
- Symptom: A deleted CSS rule still applies in the Designer while `pnpm dev`
  runs.
- Cause: The canvas never runs scripts, so both the staging and the
  localhost `<link>` stay live. They are additive; staging's copy of the
  rule remains.
- Fix: push and wait for staging, or temporarily comment out the `bv-css`
  link in the Embed.
- Status: documented (loader.html, AGENTS.md)
- Found by: human

### 2026-10-02 · Static localhost link is requested by public visitors
- Area: loader
- Scope: template-candidate
- Symptom: Published pages request `http://localhost:3000/styles.css`; can
  block render and trigger Chrome's local-network-access prompt.
- Cause: The canvas Embed carries a static localhost `<link>` so the
  Designer can see local CSS; the script that removes it runs after the
  browser has already started the request.
- Fix: reformd e9f81ab and regenx a66d116 removed the static link
  independently and create it from script only in dev mode. Trade-off: the
  canvas then shows staging CSS only.
- Status: open in template
- Found by: human

### 2026-10-02 · VER lives in two snippets and a placeholder 404s at launch
- Area: release
- Scope: template-candidate
- Symptom: Prod CSS and JS both 404 the moment a custom domain is attached.
- Cause: `VER = "X.Y.Z"` is never exercised on `*.webflow.io`, and a release
  must bump VER in both the Embed and the footer snippet.
- Fix: regenx keeps one `RELEASE` value in the head config (`null` until the
  first tag) that the other snippets read.
- Status: open
- Found by: human

### 2026-10-02 · The add -f dist / untrack release ritual is error-prone
- Area: release
- Scope: template-candidate
- Symptom: Empty release tags, re-cut versions, `dist/` swept into unrelated
  commits.
- Cause: `dist/` is gitignored except in release commits. terawulf re-cut
  v1.1.1 with a tree identical to v1.1.0.
- Fix: brandvm, adaria and nexplan commit `dist/` permanently and fail CI on
  `git diff --exit-code -- dist`.
- Status: open
- Found by: human

### 2026-10-02 · One throwing module leaves the page scroll-locked
- Area: js
- Scope: template-candidate
- Symptom: Page stays locked, or later modules never initialise.
- Cause: `src/index.ts` runs modules as a chain.
- Fix: reformdd and brandvm wrap each init in `run(name, init)` with
  try/catch; the template only has `finally` around the lock release.
- Status: partly fixed
- Found by: human

### 2026-10-02 · CDN `defer` scripts cannot be ordered against the bundle
- Area: js
- Scope: template-candidate
- Symptom: Lenis, GSAP or Finsweet is undefined when a module runs.
- Cause: The footer loader appends the bundle dynamically (async), so a
  sibling `<script defer>` has no ordering promise.
- Fix: bundle libraries with `pnpm add`. Do not also load Webflow's own GSAP
  or jQuery a second time.
- Status: documented
- Found by: human

### 2026-10-02 · Webflow's anchor scroll ignores a sticky header
- Area: js
- Scope: project
- Symptom: Same-page hash links land under a sticky nav.
- Cause: Webflow's scroll module offsets only for `position: fixed` headers
  and never reads `scroll-margin-top`.
- Fix: threestars `anchor-scroll.ts` unbinds `click.wf-scroll` and measures
  `--nav-h` from the nav.
- Status: project pattern
- Found by: human
