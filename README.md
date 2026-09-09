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
    credentials-map.ts
    credentials-camera.ts
    credentials-list.ts
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

## Credentials hero map

The `S | Credentials Hero` Webflow component uses the supplied `Map 1.svg`
geometry in `credentials-map-interactive.svg`. Its six country mask paths
have `data-credentials-region` keys matching the dots. Interactive countries
start at 70% opacity, the hovered/focused country reaches 100%, and all other
countries remain at 20%. The module inlines that SVG to update its mask;
the image stays as a fallback and keeps the layout stable during loading.
The map is independent of the homepage map and needs no color inversion.
`credentials-map.ts` aligns its country controls using `data-map-x` and
`data-map-y` in the original 2039 × 1344 coordinate system. Its country
keys are `usa`, `uk`, `france`, `germany`, `italy`, and `spain`.
The map scene caps at 1280px (`80em` at its inherited 16px font
size), with visible SVG overflow and a fade spanning the viewport.
Authored map layout and typography sizes use `em`, including responsive
overrides; SVG coordinates and measured camera transforms use native units.
On desktop, cards start closed and appear beside a hovered dot, remaining open while
the pointer is over the card. Leaving both dismisses the preview; desktop
clicks do not pin it. Keyboard focus and touch taps offer equivalent access,
and Escape dismisses the card. A subtle ripple marks the interactive dots.
Both the ripple and card transitions respect reduced-motion preferences.
Below 768px the country tabs, native `Credentials Map Viewport`, and country
card stack in that order. Tabs hug their labels and wrap in a flex row.
The first country starts selected; changing tabs
keeps the card visible below the map and flies the camera to the new country.
Flights pull back between countries, accept mid-flight changes, and settle
on a sharp SVG viewBox. The fallback image uses the same camera if SVG
enhancement fails. `data-map-camera-width` optionally sets each country's
visible width in SVG units (defaults: 650 for the USA and 220 for Europe).
The tabs support Left/Right arrow keys, Home, and End, with one active tab stop.
Reduced motion switches the camera immediately. Resizing back to desktop
restores the full map and closed hover cards.
Webflow reserves the SVG's `2039 / 1344` aspect ratio and authors the card
as hidden. Marker placement uses that same ratio rather than waiting for
the image's intrinsic height, preventing a reload flash on slow downloads.

The selected mandates section has the ID `credentials` and listens for
`credentials:filter`. The event's `detail.country` is the selected country
key, or `all` from the hero's main CTA, and fires before normal anchor
scrolling. Only the hero's project links change the list filter; hovering
the map or using its mobile tabs keeps the list selection separate.
Optional `data-credentials-count` attributes on markers can supply CMS
counts; absent counts display “Selected credentials.”

## Selected mandates list

Webflow owns the native Mandates Collection List, the country radio form,
the existing `C | Mandate Card` Big Card variant, and native pagination
(page size is controlled in Webflow, newest first). Country is a six-value Option field;
Transaction Type supplies the short label beside Sector. Existing amounts,
notes, images, and dates are preserved. The filter count comes from the
actual CMS results, and Show more appears only when more results exist.

`credentials-list.ts` starts Finsweet Attributes v2 List Filter and List
Load, with `fs-list-instance="credentials"` scoping the controls. It also
connects the map CTA event, follows the navbar height for the sticky bar,
and formats the dates Webflow renders as month/year from `data-mandate-date`.
Keep `id="credentials"` and `data-credentials-list` on the outer section:
map buttons scroll its top edge to the viewport top with no header offset.
The list's `fs-list-showquery="true"` setting preserves filters in the URL.
Keep the Country field element (`fs-list-field="country"`) inside each
CMS item, even though it is visually hidden.

Finsweet is pinned to `@finsweet/attributes@2.7.1`; only its List distribution
and shared chunks are bundled. Do not add a second Attributes CDN script.
The package's published manifest incorrectly depends on private workspace
packages absent from npm. `.pnpmfile.cjs` removes those dependencies for
this exact version; its shipped distribution is already self-contained.
When upgrading, review that hook and the pinned distribution import path.

## Homepage preloader

`G | Home Preloader` is the first component on Home, before Page Wrapper.
Its component root uses the native `Home Preloader` class with `display: none`
and directly contains the SVG Custom Elements (svg, groups and paths).
There is no inner Div or Embed. `embeds/home-preloader.html` is the reference markup for
rebuilding that native tree. Styles and bootstrap are in the homepage's
head custom code, mirrored in `embeds/home-preloader-head.html`.
Update the native tree or homepage head code when changing the corresponding file.
It reuses the navigation logo's SVG paths, with individually grouped letters.

`src/modules/home-preloader.ts` runs the 5.2-second sequence and releases
Lenis and keyboard interaction when it finishes. The homepage ID guards the
bootstrap, and `sessionStorage` key `ts-home-intro-seen` skips repeat visits
within the tab session. Reduced motion skips the intro. The head bootstrap has an
independent 9-second timeout if the bundle fails. The markup stays hidden in
Designer through its native class, where page head code does not run, with no
Embed warning. On published Home, the head rule overrides that class to show it.
Letters overlap with 1-second fade/rise animations staggered by 110ms;
the final reveal uses a gradual 1-second fade.

To replay while testing, clear `ts-home-intro-seen` from session storage and
reload Home. Ship the updated bundle alongside the Webflow component and page
head code. Without the bundle, the head bootstrap reveals the page on timeout.

## Contact form

The Contact page uses `S | Contact` with native Webflow form fields,
validation, submit, success and error states. No custom submission handler
is added. Full Name, Email and Message are required.

The current MCP cannot set native placeholders or select choices.
`contact-form.ts` reads `data-contact-placeholder` on inputs and the
pipe-separated `data-contact-subject` choices on the native select.
Edit those attributes in Designer to change the copy. The section's
`contact-form` ID is the destination of the hero’s Send a Message link.
Office addresses, hours and the optional map retain the design placeholders.

## Further reading

[`CLAUDE.md`](CLAUDE.md) documents the token architecture, the Webflow
Designer gotchas that have already cost time, and the open decisions
still outstanding. It is worth reading before making a change to either
the tokens or the loader.

## Navigation anchors

Navigation destinations are saved directly in Webflow as page-and-fragment URLs.
About uses `our-story`, `our-approach`, and `leadership-team` on its section elements.
Services uses a persistent ID on each existing Service List Item wrapper:
`real-estate-debt-arranging`, `equity-raising-liquidity-sourcing`,
`debt-restructuring-workout`, `structured-debt-advisory`,
`mezzanine-debt-arranging`, and `real-estate-agency`.
Press uses `coverage-and-commentary` on its coverage section; the featured
navigation cards also lead to that section.

`navigation.ts` manages dropdowns, mobile menu state, focus, and scroll locking.
It does not create target IDs, rewrite link URLs, or intercept anchor scrolling.
Keep section IDs and saved navigation URLs in sync when changing destinations.
