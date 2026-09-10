# Link repairs — 10 September 2026

Follow-up to the [original link audit](link-audit-2026-09-10.md). Changes were made in Webflow's native component settings and CMS fields; no JavaScript URL rewriting was added.

Published to [Webflow staging](https://three-stars.webflow.io/) and verified after publication. No custom domain was published.

## Verification

- Re-crawled 14 successful page responses: all 12 published static/utility paths plus both Press pagination aliases.
- Checked 592 link occurrences: 468 valid internal links, 65 external links, 25 email links, 21 phone links, and 13 intentional JavaScript action controls.
- Found no empty navigation URLs, example-domain placeholders, broken internal links, or missing destination anchors. All 15 distinct internal fragment targets exist.
- Confirmed all 27 repaired component/native URL settings in published markup, all seven CMS article URLs, and all three newly added section IDs.
- All four Press PDFs and the existing Code of Ethics PDF returned HTTP 200. The only external URL not verified by HTTP was Mauro Savoia's existing LinkedIn profile, which returned LinkedIn's automated-access block (999).
- Confirmed all three empty biography LinkedIn links are omitted from the published About page.
- Re-probed the 16 unbuilt CMS detail routes: they still return the branded 404, and none is linked from a successful page.
- Checked email/telephone syntax without sending messages, calling numbers, or submitting forms. Existing JavaScript action controls were classified from their handlers; this crawl did not exercise their interactions.

The [post-repair CSV](link-verification-2026-09-10.csv) records every checked link occurrence. The original audit and its CSV remain unchanged as the baseline.

## Repaired destinations

| Area | Changes |
| --- | --- |
| Hero buttons | Home and About “Our Credentials,” Services “Our Track Record,” and Press “Track Record” now target `/credentials`. About “Meet the Team” targets `/about#leadership-team`. |
| Homepage services | All six cards target their matching sections on `/services-overview`, using the existing section IDs. |
| Shared footer | Our Approach → `/about#our-approach`; Track Record → `/credentials`; Sectors → `/credentials#sectors`; Milan Office → `/contact#milan-office`; New York Office → `/contact#new-york-office`; Press Enquiries → `/contact#contact-form`. Code of Ethics uses the existing Webflow-hosted PDF already linked from About. |
| Team biographies | The two office-address rows target the corresponding Contact office anchors, across all three biographies. The shared LinkedIn element is hidden while the People CMS profile fields are empty. |
| Style guide | About, Credentials, Press, and Contact examples target their corresponding pages. The three generic link-style samples target Contact. |
| Press CMS | All seven `article-url` placeholder values were replaced with four original publication PDFs from the existing company website. |

Added native IDs `sectors`, `milan-office`, and `new-york-office` to the corresponding existing section or office wrapper. Existing links targeting Press sections were left unchanged.

## Press sources

The original company site at [threestarscp.com](https://www.threestarscp.com/) linked these PDFs under its `/_files/ugd/` paths. They were initially recovered from Wix and subsequently migrated into Webflow's `Used in Figma / Press` asset folder because the Wix originals are scheduled for deletion. The current Webflow URLs below return HTTP 200 and are byte-identical to fresh downloads of the Wix originals.

All seven CMS article URLs were updated and published. A fresh scan of 14 successful page responses, three linked stylesheets, and all four CMS collections found no remaining Wix file references. The [migration manifest](wix-file-migration-2026-09-10.json) records original URLs, Webflow URLs, asset IDs, and affected CMS items. Earlier CSV audits retain the historical URLs as evidence of the previous state.

| CMS slugs | Destination |
| --- | --- |
| `apollo-rome-debut`, `apollo-rome-debut-archive` | [Apollo provides €105m financing for luxury hotel's Rome debut](https://cdn.prod.website-files.com/6a97103d40ea05346a443224/6aa2ee303afb8defb1f2aa53_press-apollo-rome-debut-react-news.pdf) |
| `italian-icon-refinancing`, `italian-icon-refinancing-archive` | [Inside the €330m refinancing of an Italian icon](https://cdn.prod.website-files.com/6a97103d40ea05346a443224/6aa2ee77ec022b0c3c5a11bf_press-italian-icon-refinancing-real-estate-capital.pdf) |
| `italy-debt-play`, `italy-debt-play-archive` | [The return of Italy's debt play](https://cdn.prod.website-files.com/6a97103d40ea05346a443224/6aa2ee78ec022b0c3c5a11de_press-return-of-italy-debt-play-real-estate-capital.pdf) |
| `rome-edition-financing` | [GlobalCapital: Statuto builds €59m Vienna minibond](https://cdn.prod.website-files.com/6a97103d40ea05346a443224/6aa2ee78503e0d5cf3e71bc9_press-rome-hotel-financing-globalcapital.pdf), the company's 2016 coverage of the Rome hotel financing. |

Existing CMS titles, dates, images, duplicates, and other content were retained. Several dates are placeholders or differ from the source publication dates; these still need editorial review.

## Maintenance

- Populate approved People CMS LinkedIn URLs before restoring the biography LinkedIn element. Its visibility is currently a static false value; adding a URL alone does not restore it. Configure a native “LinkedIn is set” condition when restoring the element so incomplete profiles remain hidden.
- Office links now reach the right Contact blocks, whose address copy still contains design placeholders.
- The 16 unbuilt CMS detail routes remain unlinked. People use biographies, services use overview sections, mandates use the Credentials list, and Press uses external PDFs.
- LinkedIn's personal profile endpoint blocks automated checks with HTTP 999, so the existing Mauro Savoia link on Contact still needs a manual check.
