# Three Stars Capital Partners

Webflow site. Design tokens live in Webflow Variables; custom CSS/JS ship
from this repo through a CDN. The Designer owns layout and classes; this
repo owns tokens-as-CSS, resets, utilities, and JS-paired styles.

## Commands

    pnpm dev      # esbuild watch + server on :3000 (unminified, sourcemaps)
    pnpm build    # minified -> dist/
    pnpm check    # tsc --noEmit

`dist/` is gitignored. Pushing to `master` triggers `.github/workflows/
staging.yml`, which builds and deploys `dist/` to GitHub Pages.

## How CSS/JS reach the page

Three snippets, pasted into Webflow, documented in `loader.html`. Read that
file before touching any of them.

- **Head code** — meta, preconnect, pre-paint scroll lock
- **Embed on canvas** — the `<link>` tags + config script. Must be an Embed,
  not head code, because the canvas renders Embed markup but ignores site
  custom code
- **Footer code** — appends the JS bundle

Environments: prod = pinned jsDelivr tag; `*.webflow.io` = GitHub Pages
staging; `?bv-dev=1` = localhost.

## Working from another machine

Sessions cannot move between machines — they are keyed to one machine's
absolute project path. The repo is the handoff: push before switching, pull
on arrival, start a fresh session. This file loads automatically.

Setup on a new machine: clone, `corepack enable && pnpm install`, then
approve the project MCP server on first launch and run `/mcp` to authorise
Webflow (OAuth, per machine). `.mcp.json` carries the server definition;
claude.ai connectors (Figma, Slack, Drive…) follow the account, not the
machine.

## Gotchas that have already cost time

**The Designer canvas never runs scripts.** The config script that rewrites
the stylesheet hrefs does not execute there, so *both* `<link>`s stay live
and the localhost one wins (it is second). The canvas has no live reload —
reload the Designer tab.

**The canvas loads two stylesheets, and they are additive.** Removing a rule
from local CSS does not remove staging's copy; there is nothing left to
override it, so staging's rule stands. **Deletions cannot be tested on
localhost** — push, or temporarily comment out the `bv-css` link.

**Probe with `background`, not `outline`.** An outline on `body` paints
outside the border box, lands outside the canvas iframe, and gets clipped by
`overflow-x: clip`. It looks like the CSS is not loading when it is.

**A variable mode does not apply variables.** It only changes what they
resolve to. `color` is inherited and was already computed on `body`, so any
class that sets a Colors Semantic mode **must also declare `color`** —
otherwise `currentColor`, and every `u-muted-*` built on it, keeps the
inherited light-mode value. `.is-dark` is the reference.

**Layout tokens are `em` and render 6.25% short.** Body is `Size/Body` →
`Size/15` = `0.9375em`, so 1em is 15px, not 16. Values authored as
Figma-px ÷ 16 therefore undershoot: `Container/Max Width: 80em` renders
1200px where Figma wants 1280px; gutters 75px vs 80px. UNRESOLVED — see
Open decisions.

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

## Open decisions

- **Layout `em` → `rem`.** Fixes the 6.25% shortfall; numbers stay identical
- `Nav/Height` is 6.5em at Mobile L but 4.8125em at Tablet/Phone — the topbar
  is hidden at all three, so Mobile L looks missed
- `--nav-h: 6rem` is a third source of truth against `Nav/Height`; it drives
  `scroll-margin-top` on every `[id]`. Blocked on the unit question above
- **`VER = "X.Y.Z"` in `loader.html`, and the repo has zero git tags.** Prod
  CSS and JS both 404 the moment a custom domain is attached. Cheapest fix,
  highest consequence
- Accessibility, unstarted: root font-size overrides the browser's font-size
  preference; no `color-scheme`; `[data-gradient-text]` renders invisible
  under forced-colors
- Footer semantics: nav links have no landmark and are not lists; column
  labels are inert `div`s; logo SVG is not `aria-hidden`
- One moderate Dependabot advisory
