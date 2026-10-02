# Three Stars Capital Partners — Webflow custom code

Agent instructions for this repository. Codex, Cursor and similar tools read
this file directly; Claude Code reads it through `CLAUDE.md`. It is the single
source of agent rules — edit this file, never a copy of it.

Webflow site. Design tokens live in Webflow Variables; custom CSS/JS ship
from this repo through a CDN. The Designer owns layout and classes; this
repo owns tokens-as-CSS, resets, utilities, and JS-paired styles.

Use `em`, not `rem`, for authored layout and typography sizes. Preserve
existing variables and user edits. SVG coordinates and measured camera
transforms retain their native units.

## Project facts

- Client / site: Three Stars Capital Partners
- GitHub: `brandvm/threestars`, default branch `master`
- Webflow site ID: `6a97103d40ea05346a443224` (from
  `audits/wix-file-migration-2026-09-10.json`)
- Staging site: `https://three-stars.webflow.io`
- Staging bundles: `https://brandvm.github.io/threestars/`
- Production bundles: `https://cdn.jsdelivr.net/gh/brandvm/threestars@<VER>/dist/`
- Production domain: not attached yet (the old Wix site is
  `www.threestarscp.com`; no custom domain was published as of the
  2026-09-10 link audit)
- Production release: none yet — the repo has zero git tags and
  `loader.html` still carries `VER = "X.Y.Z"` (see Open decisions)

## Who owns what

Webflow owns markup, layout, classes, components, CMS content, interactions
**and styling by default**. This repo owns JavaScript behaviour and only the
CSS the Designer cannot express.

That split is deliberate. Repo CSS loads from an Embed after `webflow.css`,
so it wins every specificity tie against the Designer. Any rule written here
that the Designer could have expressed becomes a hidden override: the next
person changes that style in the Designer, nothing happens, and the only fix
is edit `src/` → push → wait for staging → reload the Designer. Every project
built from this template has lost time to that loop.

## CSS policy — Designer first

Existing rules predate this policy and are untagged; add a `repo-css` tag to
any rule you touch, and question rules the Designer could own.

Before writing any CSS, decide where it belongs.

1. **Can the Designer do it?** A class or combo class style, a variable, a
   breakpoint style, a state (hover/focus/current), an interaction. If yes:
   - With the Webflow MCP connected, apply it in Webflow (styles and
     variables tools), then tell the user what was changed.
   - Without the MCP, give the user exact Designer steps: class, breakpoint,
     property, value.
   - Do **not** add it to `src/styles.css`.
2. **Repo CSS needs a reason.** Every rule — or the section header comment
   covering a group of rules — carries one tag from this list:

   ```css
   /* repo-css: <tag> — <short why> */
   ```

   | Tag | Use for |
   | --- | --- |
   | `js-state` | Classes/attributes a module toggles (`.is-open`, `.is-loading`, `[data-state]`) |
   | `designer-cant` | Name the feature: `:has()`, complex combinators, `@keyframes`, `@supports`, container queries, `::marker`, `color-mix()`, masks |
   | `third-party` | Swiper, Lenis, Finsweet or other library markup |
   | `canvas-preview` | `.w-editor`, `.wf-design-mode`, `html:not([data-wf-domain])` helpers |
   | `approved-base` | A site-wide base the user explicitly asked to keep in code |
   | `override-webflow` | Overriding a `.w-*` default or a Designer style |

3. **`override-webflow` needs the user's explicit approval** and a
   `GOTCHAS.md` entry explaining why. Ask before writing it.
4. **Never, without that approval:** set `font-size` on `:root`/`html`,
   neutralize `.w-*` defaults, or reference Webflow variable names
   (`--_layout---…`, `--_typography---…`). A renamed variable in Webflow
   silently breaks every rule that reads it — Webflow rewrites its own
   references, never this bundle's.
5. **Ambiguous request?** Say which parts go in the Designer and which go in
   code before editing anything. "Make the heading bigger on mobile" is a
   Designer breakpoint style, not a media query here.

Pre-existing exceptions in this repo, all predating the policy (log any
change to them in `GOTCHAS.md`):

- §01 sets the fluid root `font-size` (ideal 1440, plus a 430 mobile scale).
- §01 wide-gamut overrides redefine the Webflow colour primitives
  (`--_colors---brand--…`, `--_colors---navy-tint--…`, …) inside
  `@supports` blocks — see Token architecture.
- §03 points `.w-layout-blockcontainer` at
  `var(--_layout---container--max-width, none)` (bca58fb). Renaming the
  Layout collection, the Container group or the Max Width variable degrades
  it to uncapped, silently.

## Architecture

### How CSS/JS reach the page

Three snippets, pasted into Webflow, documented in `loader.html`. Read that
file before touching any of them.

- **Head code** (Site settings) — meta, preconnect, pre-paint scroll lock
  (`html.is-loading`, 3s safety timeout). Not rendered on the canvas.
- **Embed on canvas** — the `<link>` tags (Remix Icon font, `bv-css`
  staging, `bv-css-dev` localhost) + config script that sets `window.BV`.
  Must be an Embed, not head code, because the canvas renders Embed markup
  but ignores site custom code. **So `src/styles.css` is visible on the
  Designer canvas.**
- **Footer code** — appends the JS bundle.

Environments: prod = pinned jsDelivr tag; `*.webflow.io` = GitHub Pages
staging; `?bv-dev=1` = localhost (persists in localStorage; `?bv-dev=0`
clears). Dev mode is localhost-only — a LAN IP is blocked as mixed content.

Exception: the homepage preloader's styles and bootstrap live in the **Home
page head code** (mirrored in `embeds/home-preloader-head.html`), so they
are *not* visible on the canvas — by design; the native `Home Preloader`
class keeps the markup `display: none` there. `embeds/home-preloader.html`
is the reference markup for the native SVG tree. Update the Webflow side
when either file changes; neither is versioned by a push.

### Source layout

- `build.mjs` drives esbuild directly: `src/index.ts` → `dist/index.js`,
  `src/styles.css` → `dist/styles.css`.
- `src/index.ts` imports and starts the modules in `src/modules/`, one
  feature per file, each no-op when its markup is absent.
- `src/styles.css` is one file in numbered sections (01 tokens … 08 editor
  & dev supports) with cascade notes and a table of contents at the top.
  Add rules to the section they belong to, never to the end of the file.
- TypeScript is `strict`, targets ES2019, no path aliases.
- Third-party libraries are bundled with `pnpm add` (Lenis,
  `@finsweet/attributes`), never added as CDN tags.
- Finsweet is pinned to `@finsweet/attributes@2.7.1`; only its List
  distribution is bundled. Its published manifest depends on private
  workspace packages absent from npm; `.pnpmfile.cjs` removes them for this
  exact version. Review that hook and the import path when upgrading. Do
  not add a second Attributes CDN script. `finsweet-list.ts` is the only
  place List starts (`startLists()`), see GOTCHAS.
- `README.md` documents each feature (credentials map and list, homepage
  preloader, contact form, navigation anchors, Press coverage and
  interviews, legal pages, 404). Read the relevant section before changing
  one. `audits/` holds the 2026-09-10 link audit and Wix → Webflow file
  migration records.

## Webflow canvas facts

**The Designer canvas never runs scripts.** The config script that rewrites
the stylesheet hrefs does not execute there, so *both* `<link>`s stay live
and the localhost one wins (it is second). The canvas has no live reload —
reload the Designer tab. Anything shown only after JS runs is invisible
there; use a `canvas-preview` rule (e.g. `data-bio-preview` on
`.bio-modal`, d573ed3, scoped away from published pages by
`data-wf-domain`).

**The canvas loads two stylesheets, and they are additive.** Removing a rule
from local CSS does not remove staging's copy; there is nothing left to
override it, so staging's rule stands. **Deletions cannot be tested on
localhost** — push, or temporarily comment out the `bv-css` link.

**Probe with `background`, not `outline`.** An outline on `body` paints
outside the border box, lands outside the canvas iframe, and gets clipped by
`overflow-x: clip`. It looks like the CSS is not loading when it is.

## Snippets are not versioned

A push updates the JS/CSS bundles only. Any change to `loader.html`, the
Home head code or the preloader markup must be re-pasted into Webflow and
published to take effect — say so in the commit message, and keep the repo
copies identical to what is installed.

## Commands and release

```bash
pnpm dev      # esbuild watch + server on :3000 (unminified, sourcemaps)
pnpm build    # minified -> dist/
pnpm check    # tsc --noEmit
```

Node 22 and the pinned pnpm in `package.json` (`corepack enable && pnpm
install`). No test suite; run `pnpm check` and `pnpm build` before pushing.

Pushing to `master` triggers `.github/workflows/staging.yml`, which builds
and deploys `dist/` to GitHub Pages.

`dist/` is gitignored, so a release commit needs `git add -f dist` — without
the `-f` the commit is empty, the tag carries no build, and every pinned
jsDelivr URL 404s. Same failure shape as the `VER` placeholder below, and
just as invisible: staging never touches the prod URLs.

That `-f` then has to be undone. `.gitignore` only governs files git is not
already tracking, so the release commit makes `dist/` tracked and the ignore
rule goes dead — every later rebuild shows as modified and gets swept into
unrelated commits by `git add .`. `git rm -r --cached dist` after the tag is
pushed restores it. The tag keeps its snapshot, so jsDelivr is unaffected.

Then bump `VER` in both Webflow snippets (Embed and footer) and publish.
Never move a pushed tag; cut the next patch. Never use `@latest` or a branch
URL in production. Full steps are in the README.

## Working from another machine

Sessions cannot move between machines — they are keyed to one machine's
absolute project path. The repo is the handoff: push before switching, pull
on arrival, start a fresh session. This file loads automatically.

Setup on a new machine: clone, `corepack enable && pnpm install`, then
approve the project MCP server on first launch and run `/mcp` to authorise
Webflow (OAuth, per machine). `.mcp.json` carries the server definition;
claude.ai connectors (Figma, Slack, Drive…) follow the account, not the
machine.

## Token architecture

Primitives → semantic → composite, mirrored in both systems:

    Colors           -> Colors Semantic (Light/Dark modes)
    Typography Scale -> Typography Role (breakpoint modes) -> Typography Styles (per-role modes)

Semantic roles are aliases, so overriding a **primitive** moves everything
downstream. That is why `styles.css` redefines only the primitives for the
OKLCH/P3 layer and needs no semantic-layer duplicate.

`Utility/u-muted-*` is `color-mix(… currentColor …)`, resolved at use time.
Use it for anything nested in a coloured context; use `Border/*` and
`Background/*` for structural chrome that has no meaningful inherited colour.
Both ends of a transition must come from the same family or it snaps.

A variable mode does not apply variables — any class that sets a Colors
Semantic mode must also declare `color` (`.is-dark` is the reference). See
GOTCHAS.

## Webflow MCP limits

Worked around, not fixed. Do not rediscover these:

- **`custom_value` is rejected for Color and Size variables.** `color-mix()`,
  `oklch()`, `color(display-p3 …)` and `calc()` cannot be created via MCP.
  They *can* exist in Webflow — write them as `valueType: "custom"` with an
  `expression`, via the external variables-JSON import
- **No `rename_variable_collection`, no `reorder_variable`.** Collections can
  be reordered; variables and folders within one cannot. Rename and reorder
  in the Designer (a rename there preserves ids and aliases; recreating does
  not)
- **The WHTML importer drops `class` attributes.** Create the style, then
  apply it with `set_style`
- **`get_all_elements` does not descend into component definitions.** Pass
  `scope_component_id`. An element "missing" from a page tree is usually
  inside a component
- Concurrent Designer edits change element ids mid-operation. Re-query on
  "Element not found" rather than assuming deletion
- Read responsive styles with `get_styles` → `include_breakpoints:
  ["xxl", "xl", "large", "medium", "small", "tiny"]`. Without this array,
  only base properties are returned. `breakpoint_id` is for updates only
- Conditional visibility on an element whose sibling href is CMS-bound is
  rejected ("not inside a CMS context") — set it in the Designer
- Native form placeholders and select choices cannot be set; this site
  routes them through `data-contact-placeholder` / `data-contact-subject`
  (`contact-form.ts`)

## Open decisions

- **Layout em sizing.** Keep the user's `em` convention; account for the
  element's inherited font size when matching design dimensions. Layout
  tokens are `em` and render 6.25% short (see GOTCHAS) — UNRESOLVED
- `Nav/Height` is 6.5em at Mobile L but 4.8125em at Tablet/Phone — the topbar
  is hidden at all three, so Mobile L looks missed
- **`VER = "X.Y.Z"` in `loader.html`, and the repo has zero git tags.** Prod
  CSS and JS both 404 the moment a custom domain is attached. Cheapest fix,
  highest consequence
- **Press CMS: images and link durability.** The duplicate `(archive)` items
  are gone and all ten items carry real article URLs, but two things are
  open. Six of the ten use `press-card-generic.webp` — Investcorp, Hotel
  Danieli, RiverRock, both Finance Community items and Eden Hotel need real
  images. And every PDF link now points at `threestarscp.com/_files/ugd/…`,
  which is the **old Wix site**; four of those PDFs are already re-hosted on
  Webflow's CDN and the rest are not. Decommissioning Wix breaks all of them.
  (The README and `audits/link-fixes-2026-09-10.md` record the four PDFs as
  migrated and published to seven Press entries on 2026-09-10 — verify
  which statement is current before acting.)
- **Two Press items share one article URL.** Both Finance Community cards
  point at `financecommunity.it/credit-suisse-60-milioni-la-forgiatura/`,
  as annotated in Figma, but the Svim San Babila placement is a different
  article. Its real URL is still needed
- **`.eyebrow` and `.meta` fail AA.** Both resolve to `Text/Tertiary` →
  `Navy Tint/Navy 55`, which composites to ≈3.7:1 on `Background/Page`
  where AA wants 4.5:1. Neither qualifies for the large-text exemption:
  `Size/Eyebrow` is `Size/12` and `Size/Meta` is `Size/11`, so ~11.25px and
  ~10.3px at the 15px root. `Navy 65` is the first step that clears it
  (≈5.05:1); `Navy 70` gives ≈5.9:1. One token, but it moves every eyebrow
  and date on the site
- The LinkedIn row in the bio modal needs conditional visibility set in the
  Designer (LinkedIn → is set). The MCP rejects it — "not inside a CMS
  context" — even though the href beside it is CMS-bound. May already be
  covered by `.w-dyn-bind-empty` in §03; check before spending time
- Accessibility, unstarted: root font-size overrides the browser's font-size
  preference; no `color-scheme`; `[data-gradient-text]` renders invisible
  under forced-colors
- Footer semantics: nav links have no landmark and are not lists; column
  labels are inert `div`s; logo SVG is not `aria-hidden`
- One moderate Dependabot advisory
- Optional: the map SVG is 1.5MB / 570KB gzipped and auto-traced polylines,
  which simplify well — RDP at tolerance 0.6 keeps 22.7% of the points for
  101KB gzipped, sub-device-pixel at the tightest zoom the camera reaches.
  Worth it only if a settle ever hitches; it is one URL swap

## Session protocol

1. **Start:** read `GOTCHAS.md`. Do not repeat a mistake already logged.
2. **During:** when something surprising costs time — a Webflow quirk, a
   template default that gets in the way, an MCP limitation, a fix that had
   to be reverted — add an entry to `GOTCHAS.md` in the same commit as the
   fix, using the format at the top of that file.
3. **Scope:** tag an entry `template-candidate` when it would recur on any
   project built from `wf-template`; those entries are collected later to
   improve the template. Otherwise tag it `project`.
4. Never delete entries. Update `Status` when something is fixed or
   upstreamed.
