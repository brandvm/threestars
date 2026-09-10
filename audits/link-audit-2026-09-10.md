# Three Stars link audit — 10 September 2026

Audited the published staging site at https://three-stars.webflow.io against the Webflow static-page and CMS inventories. This was a read-only site audit; no Webflow links or content were changed.

## Result

Several links need attention. Five hero buttons lead to the wrong page; six homepage service cards, seven shared footer links, and nine links inside team biographies use `#`. All seven Press CMS items still use `https://example.com` as their article URL.

The main navigation, its section anchors, legal-page links, contact-form anchor, credentials anchor, press pagination, and 404 recovery links resolve correctly. No actual internal hyperlink in the crawl pointed to a missing page or missing fragment. A separate inventory check found 16 unavailable CMS detail routes, with no links to them in the pages crawled.

## Coverage and method

- 12 distinct published page paths: 10 public content pages, the native `/404` utility page, and `/design/style-guide`.
- Two Press pagination URLs were also fetched: page 2 and the page-1 query-string alias.
- 16 CMS detail routes were probed from all four collections, including items absent from navigation. All collection result counts matched their reported totals.
- 595 link occurrences inspected across the 14 successful page responses; repeated shared components and the page-1 alias are included in that raw count. Links in the 16 fallback 404 responses were excluded to avoid counting the same error page repeatedly.
- Every HTTP destination was fetched with redirects followed. Twelve distinct internal fragment destinations were checked against actual destination-page IDs.
- Eight distinct external URLs were checked, including the Code of Ethics PDF. Email and phone links were checked for syntax only; no messages, calls, or form submissions were made.
- Region selectors, country-map controls, and biography-open controls use `#` intentionally and have corresponding JavaScript handlers; they are excluded from missing-destination findings. Interactive behavior was not browser-tested as part of this crawl.
- The unpublished Starter page was excluded. `/sitemap.xml` was unavailable on staging, so the Webflow page and CMS inventories supplied the seeds.

## Hero buttons pointing to the wrong page

These URLs return 200, but the destination does not match the label. Suggested targets below already exist.

| Source | Button | Current | Suggested |
| --- | --- | --- | --- |
| [/](https://three-stars.webflow.io/) | Our Credentials | `/contact` | `/credentials` |
| [/about](https://three-stars.webflow.io/about) | Meet the Team | `/contact` | `/about#leadership-team` |
| [/about](https://three-stars.webflow.io/about) | Our Credentials | `/contact` | `/credentials` |
| [/press-overview](https://three-stars.webflow.io/press-overview) | Track Record | `/contact` | `/credentials` |
| [/services-overview](https://three-stars.webflow.io/services-overview) | Our Track Record | `/contact` | `/credentials` |

## Homepage service cards

All six cards on the homepage use `href="#"`. The corresponding Services sections already exist:

| Card | Suggested destination |
| --- | --- |
| Real Estate Debt Arranging | `/services-overview#real-estate-debt-arranging` |
| Equity Raising & Liquidity | `/services-overview#equity-raising-liquidity-sourcing` |
| Debt Restructuring | `/services-overview#debt-restructuring-workout` |
| Structured Debt Advisory | `/services-overview#structured-debt-advisory` |
| Mezzanine Debt Arranging | `/services-overview#mezzanine-debt-arranging` |
| Real Estate Agency | `/services-overview#real-estate-agency` |

## Shared footer

Seven links in `G | Footer` use `#` and recur across every published page. Fixing their shared component would address all occurrences.

| Link | Suggested destination or outstanding decision |
| --- | --- |
| Our Approach | `/about#our-approach` |
| Code of Ethics | The existing Code of Ethics PDF linked from About; see external checks below. |
| Track Record | `/credentials` |
| Sectors | Add an ID to the existing “Sector Focus” section on Credentials, then target it. That section currently has no ID. |
| Milan Office | `/contact`, or add a specific office-section ID once the content is confirmed. No office anchor currently exists. |
| New York Office | `/contact`, or add a specific office-section ID once the content is confirmed. No office anchor currently exists. |
| Press Enquiries | `/contact#contact-form`; use an approved press-specific email address instead if one is provided. |

## Press article links

All seven CMS `article-url` fields contain `https://example.com`. The cards appear on Home and across both Press pagination pages. These need approved source article URLs; a status-code check alone cannot validate a placeholder destination.

| CMS item | Slug |
| --- | --- |
| Italy's debt play (archive) | `italy-debt-play-archive` |
| Italian icon refinancing (archive) | `italian-icon-refinancing-archive` |
| Apollo financing, Rome debut (archive) | `apollo-rome-debut-archive` |
| The return of Italy's debt play | `italy-debt-play` |
| Rome Edition Hotel Financing | `rome-edition-financing` |
| Inside the refinancing of an Italian icon | `italian-icon-refinancing` |
| Apollo provides financing for Rome debut | `apollo-rome-debut` |

## Team biography links

Each of the three biographies on About contains two office-address links and a LinkedIn link with `href="#"`: nine unresolved links total.

- The office rows should target confirmed map URLs or the appropriate Contact section. The current Contact page still contains address placeholders.
- All three People CMS `linkedin` fields are empty. Add approved profile URLs or hide each link when no URL is supplied. The published markup currently includes the links without a conditional-hidden class.
- Mauro Savoia has a profile URL already used on Contact, but its automated request was blocked by LinkedIn; see below.

## External checks

| Destination | Result |
| --- | --- |
| [http://www.google.com/policies/privacy/ads/](http://www.google.com/policies/privacy/ads/) | HTTP 200; redirects to https://www.google.com/policies/technologies/ads/ |
| [https://cdn.prod.website-files.com/6a97103d40ea05346a443224/6a9b1f6c24661449181079e1_Codice%20Etico%20TSCP.pdf](https://cdn.prod.website-files.com/6a97103d40ea05346a443224/6a9b1f6c24661449181079e1_Codice%20Etico%20TSCP.pdf) | HTTP 200 |
| [https://example.com](https://example.com) | Placeholder domain; replace. DNS lookup also failed in this audit environment. |
| [https://it.linkedin.com/in/maurosavoia](https://it.linkedin.com/in/maurosavoia) | HTTP 999 — LinkedIn blocked automated access. Not classified as broken; manual verification remains. |
| [https://www.brandvm.com/](https://www.brandvm.com/) | HTTP 200 |
| [https://www.linkedin.com/company/three-stars-capital-partners/](https://www.linkedin.com/company/three-stars-capital-partners/) | HTTP 200 |
| [https://www.threestarscp.com/](https://www.threestarscp.com/) | HTTP 200 |
| [https://www.youronlinechoices.com](https://www.youronlinechoices.com) | HTTP 200 |

The three biography company-name links intentionally or inadvertently leave staging for `https://www.threestarscp.com/`; that existing website resolves successfully. Confirm this is desired during staging review.

## CMS detail routes

All 16 inventory-derived detail routes below return the branded 404 response. None is the destination of a hyperlink found in the successful page responses. They are unavailable routes, rather than broken navigation links. The site currently presents people through biography modals, services through overview sections, mandates through lists, and press through external article cards; confirm whether standalone detail pages are intended before creating or linking them.

| Collection | Route | Status |
| --- | --- | --- |
| People | [/people/sabrina-battista](https://three-stars.webflow.io/people/sabrina-battista) | 404 |
| People | [/people/cinzia-damato](https://three-stars.webflow.io/people/cinzia-damato) | 404 |
| People | [/people/mauro-savoia](https://three-stars.webflow.io/people/mauro-savoia) | 404 |
| Press | [/press/italy-debt-play-archive](https://three-stars.webflow.io/press/italy-debt-play-archive) | 404 |
| Press | [/press/italian-icon-refinancing-archive](https://three-stars.webflow.io/press/italian-icon-refinancing-archive) | 404 |
| Press | [/press/apollo-rome-debut-archive](https://three-stars.webflow.io/press/apollo-rome-debut-archive) | 404 |
| Press | [/press/italy-debt-play](https://three-stars.webflow.io/press/italy-debt-play) | 404 |
| Press | [/press/rome-edition-financing](https://three-stars.webflow.io/press/rome-edition-financing) | 404 |
| Press | [/press/italian-icon-refinancing](https://three-stars.webflow.io/press/italian-icon-refinancing) | 404 |
| Press | [/press/apollo-rome-debut](https://three-stars.webflow.io/press/apollo-rome-debut) | 404 |
| Services | [/services/debt-restructuring](https://three-stars.webflow.io/services/debt-restructuring) | 404 |
| Services | [/services/equity-raising-liquidity](https://three-stars.webflow.io/services/equity-raising-liquidity) | 404 |
| Services | [/services/real-estate-debt-arranging](https://three-stars.webflow.io/services/real-estate-debt-arranging) | 404 |
| Mandates | [/mandates/luxury-hotel-rome](https://three-stars.webflow.io/mandates/luxury-hotel-rome) | 404 |
| Mandates | [/mandates/hotel-danieli-venice](https://three-stars.webflow.io/mandates/hotel-danieli-venice) | 404 |
| Mandates | [/mandates/six-senses-london](https://three-stars.webflow.io/mandates/six-senses-london) | 404 |

## Style guide

The public `/design/style-guide` page has seven additional `#` links: About, Credentials, Press, Contact, and three link-style samples. These appear to be demonstrations rather than intended production navigation. Keep them out of the production link-fix count, and decide whether the style guide should remain public.

## Successful page responses

| URL | Status | Links inspected |
| --- | --- | --- |
| [/](https://three-stars.webflow.io/) | 200 | 52 |
| [/404](https://three-stars.webflow.io/404) | 200 | 35 |
| [/about](https://three-stars.webflow.io/about) | 200 | 64 |
| [/contact](https://three-stars.webflow.io/contact) | 200 | 40 |
| [/cookie-policy](https://three-stars.webflow.io/cookie-policy) | 200 | 36 |
| [/credentials](https://three-stars.webflow.io/credentials) | 200 | 42 |
| [/design/style-guide](https://three-stars.webflow.io/design/style-guide) | 200 | 47 |
| [/disclaimer](https://three-stars.webflow.io/disclaimer) | 200 | 37 |
| [/press-overview](https://three-stars.webflow.io/press-overview) | 200 | 41 |
| [/privacy-policy](https://three-stars.webflow.io/privacy-policy) | 200 | 39 |
| [/services-overview](https://three-stars.webflow.io/services-overview) | 200 | 43 |
| [/terms](https://three-stars.webflow.io/terms) | 200 | 38 |
| [/press-overview?81898bdd_page=2](https://three-stars.webflow.io/press-overview?81898bdd_page=2) | 200 | 40 |
| [/press-overview?81898bdd_page=1](https://three-stars.webflow.io/press-overview?81898bdd_page=1) | 200 | 41 |

Direct `/404` returns 200 as a viewable utility-page URL; the 16 nonexistent CMS routes return HTTP 404 with that same branded error content.

## Link inventory

The adjacent [CSV inventory](link-audit-2026-09-10.csv) records every inspected link occurrence, source URL, label, href, classification, HTTP result, and suggested destination where available.

| Classification | Occurrences |
| --- | --- |
| `action` | 13 |
| `email` | 25 |
| `example-placeholder` | 15 |
| `external` | 36 |
| `internal-ok` | 358 |
| `phone` | 21 |
| `placeholder` | 120 |
| `wrong-destination` | 7 |

These counts include component repetition, style-guide examples, and pagination aliases. `external` means an external destination was found; its verification result is in the external-checks table. The actionable findings above are grouped by authored link or CMS item so repeated footer instances do not exaggerate the work.
