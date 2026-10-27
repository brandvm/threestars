# Launch — Three Stars Capital Partners

Live on `www.threestarscp.com` since 2026-10-27 (first publish 15:29 UTC).
Checklist from the `webflow-launch` skill. This repo predates the template's
`pnpm wf:*` scripts, so every check below was done by hand (curl, a
link crawler and a real browser).

## Launch day — 2026-10-27

- [x] Repo release `v1.0.0` cut and `VER` set in the config Embed and footer
  code; site republished. Live pages load `@v1.0.0` CSS and JS from
  jsDelivr and the bundle boots (Claude, 2026-10-27)
- [x] SSL valid on both hosts (Google Trust Services, expires 2027-01-25)
- [x] `http://` → `https://`, apex → `www` — single 301 each
- [x] robots.txt allows indexing; no `noindex` on live pages. webflow.io
  disallows crawling (correct)
- [ ] **301 redirects from the old site — none set up.** All 36 archived
  URLs of the old site return 404; see "Old URLs" below
- [ ] **sitemap.xml returns 404** — enable Site settings → SEO → Auto-generate
  sitemap, then submit it in Search Console [Person]
- [ ] Visual baselines — no `wf:baseline` script in this repo
- [ ] Submit a form on the live site and see it arrive [Person]

## Days 1–3 — crawl (2026-10-27)

10 pages crawled, all 200: `/`, `/about`, `/contact`, `/credentials`,
`/press-overview`, `/services-overview`, `/privacy-policy`,
`/cookie-policy`, `/terms`, `/disclaimer`. 96 distinct links checked.

Broken:

| Link | On | Cause |
| --- | --- | --- |
| `threestarscp.com/_files/ugd/c782c9_41dc…76.pdf` — "Gruppo Statuto closes on €400m+ refinancing for Milan house of Dior" | `/press-overview` | Old Wix file; gone since the domain moved |
| `…/c782c9_448d…7e.pdf` — "The building behind the loan: Hotel Danieli" | `/press-overview` | same |
| `…/c782c9_51d5…2b.pdf` — "Apollo provides €105m financing for luxury hotel's Rome debut" | `/press-overview` | same; a Webflow-hosted copy already exists (`audits/link-fixes-2026-09-10.md`) |
| `…/c782c9_cb75…a3.pdf` — "PEI — Real Estate Capital" | `/press-overview` | same |

All four PDFs are in the Wayback Machine (June 2023 snapshots), so they
can be recovered, uploaded to Webflow assets and the Press CMS links
repointed.

Not broken: the four `greenstreetnews.com` articles return 403 to bots but
load in a browser. `cdn.prod.website-files.com` (403) is a preconnect, not
a link.

## Other findings

- ~~Every visitor's browser requested `http://localhost:3000/styles.css`~~ —
  the static `bv-css-dev` link in the G | Components Embed triggered
  Chrome's "access other apps and services on this device" prompt. Fixed
  2026-10-27: the link is now created only in dev mode (as in wf-template
  0.8.0); live pages make no localhost request
- Error 1034 (Edge IP Restricted) seen once in Safari from Italy at
  15:52 UTC; not reproducible — DNS correct on every resolver, 200 from
  IT/CH/FR/NL/US. Likely a stale local DNS answer. Watch for repeats
- **No analytics** — no GA4/GTM tag on the site and no Google tag IDs in site
  settings. Confirm whether the client wants tracking (and a consent banner)
  [Person]
- **No canonical tags** on live pages
- **No Open Graph image** on the home page (title and description are set)
- **Cookie Policy, Terms and Disclaimer are live with draft copy** — their
  own meta descriptions say final legal review is pending [Person]
- No production fallback if jsDelivr fails (see `loader.html`)

## Old URLs (need 301s)

From the Wayback Machine index of `threestarscp.com`. Destinations are
suggestions — confirm against the new site. Add in Site settings →
Publishing → 301 redirects [Person]. Old paths 301 to the no-slash form
first, so redirect the no-slash path.

| Old path | Suggested destination |
| --- | --- |
| `/about-us`, `/about-us/chairman-and-ce`, `/our-approach` | `/about` |
| `/about-cinzia-damato`, `/about-cleve-lim`, `/about-giacomo-bosa-copy`, `/about-mauro-savoia-copy`, `/about-sabrina-battista`, `/about-vincenzo-cutuli`, `/copy-of-about-vincenzo-cutuli`, `/about-yanjun-huang-copy`, `/maurosavoia` | `/about#leadership-team` |
| `/services` and the seven `/services/*` pages | `/services-overview` |
| `/our-clients`, `/2011/05/our-clients` | `/credentials` |
| `/contacts` | `/contact` |
| `/2015/06/privacy-policy` | `/privacy-policy` |
| `/2011/05/ciao-mondo` | `/` |
| `/_files/ugd/*.pdf` (11 archived) | the matching Webflow asset where one exists |

## Still to do in the first 30 days

- [ ] Search Console coverage after the sitemap is submitted [Person]
- [ ] Week 1: leads arriving [Person]
- [ ] Weeks 2–4: indexing and traffic [Person]
- [ ] Re-crawl after the fixes above
