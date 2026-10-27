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

- [x] **Press PDFs fixed (Claude, 2026-10-27).** 8 of the 14 Press items
  linked to old Wix files (`threestarscp.com/_files/ugd/…`), dead since the
  domain moved. The first crawl only saw 4 because it skipped Press
  pagination.
  - 4 already had byte-identical Webflow copies from the September
    migration that the CMS never used: Apollo Rome debut, Italian icon
    refinancing, Italy's debt play, Rome Edition — repointed
  - 4 recovered from the Wayback Machine, checked page by page against
    their cards, and uploaded to Used in Figma / Press: RiverRock,
    Investcorp, Hotel Danieli "building behind the loan", Eden Hotel
    (Diritto24) — repointed
  - Only those 8 items were published; no CMS item references Wix any more
- [x] **Re-crawl after the fix:** 15 page responses (the 10 pages plus
  Credentials and Press pagination), all 200; 130 distinct links; no
  broken internal links, no Wix files, no localhost requests

Not broken: `greenstreetnews.com` (4 articles) and `financecommunity.it`
return 403 to bots but load in a browser. `cdn.prod.website-files.com`
(403) is a preconnect, not a link.

- [ ] **Svim San Babila Press item has the wrong link** — it points at the
  La Forgiatura article (`financecommunity.it/credit-suisse-60-milioni-la-forgiatura/`),
  the same URL as the La Forgiatura item. Needs the correct article URL
  [Person]

## Other findings

- ~~Every visitor's browser requested `http://localhost:3000/styles.css`~~ —
  the static `bv-css-dev` link in the G | Components Embed triggered
  Chrome's "access other apps and services on this device" prompt. Fixed
  2026-10-27: the link is now created only in dev mode (as in wf-template
  0.8.0); live pages make no localhost request
- Error 1034 (Edge IP Restricted) seen once in Safari from Italy at
  15:52 UTC; not reproducible — DNS correct on every resolver, 200 from
  IT/CH/FR/NL/US. Likely a stale local DNS answer. Watch for repeats
- **Analytics and consent banner** — GTM `GTM-K74K5RVX` + GA4
  `G-5BCSCLNS2T` behind a custom Consent Mode v2 banner (README "Cookie
  consent and analytics"). Live in production since 2026-10-27, now
  `v1.0.2` (banner waits for the homepage intro; banner clickable — see
  GOTCHAS); GTM container v4. Verified on threestarscp.com: nothing
  reaches GA4 before consent, one `page_view` on Accept, withdrawal clears
  the `_ga` cookies. The Cookie Policy lists `ts-consent`, `_ga` and
  `_ga_5BCSCLNS2T`, and the banner links to it (both live 2026-10-27)
- **No canonical tags** on live pages
- **No Open Graph image** on the home page (title and description are set)
- **Cookie Policy, Terms and Disclaimer are live with draft copy** — their
  own meta descriptions say final legal review is pending. The Cookie
  Policy's cookie list is real, but it still says "draft" and doesn't cover
  Google as processor or US data transfers [Person]
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
| `/_files/ugd/*.pdf` (11 archived) | the matching Webflow asset where one exists — 8 now have one (see Press PDFs above) |

## Still to do in the first 30 days

- [ ] Search Console coverage after the sitemap is submitted [Person]
- [ ] Week 1: leads arriving [Person]
- [ ] Weeks 2–4: indexing and traffic [Person]
- [ ] Re-crawl after the fixes above
