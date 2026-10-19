# Client comments — 2026-10-19 round

Source: Mauro Savoia's markup `Three Stars Capital Partners_Comments to
Website_20261019.pdf` (emailed 2026-10-19, not committed). It is the earlier
`…_Comments to Website.pdf` plus additions; nothing from the earlier file was
dropped, so every earlier comment still stands.

Checked against `three-stars.webflow.io` on 2026-10-19 (pages fetched and
interactive parts clicked through in a browser).

## ⚠️ State at end of day

- **Webflow changes from this session are saved but NOT published.** The
  staging site still shows the old versions until someone publishes.
- Before publishing, unpublish the two `[TBC]` interview items
  (`tbc-interview-3`, `tbc-interview-4`). They were set to draft, but an item
  that is already live may stay live after a site publish.
  Interviews collection `6aaab4b06b67d11c9e8dbf58`, items
  `6aaab4c91e2f92273f303c11` and `6aaab4c91e2f92273f303c13`.

## Done in Webflow on 2026-10-19 (unpublished)

| # | Change | Where |
|---|---|---|
| 1d | Deals ticker now runs 5 deals: £160M Six Senses London — March 2026 (was February) · €447M Hotel Danieli — December 2024 (replaces €330M) · €448.5M High Street Retail Property, Milan — May 2023 · €250M Four Seasons Hotel, Rome — 2025 · €249M Mandarin Oriental, Paris — May 2024. Both loop halves match. Euro deals no longer show £ | Component `Home Hero \| Proof Group` (`8a81c530-d52b-d0bd-cc1f-1f310111dc30`) — shared by Home and About |
| 1e | "handed down **to** junior bankers" on About (Home already had it) | About, Our Story paragraph |
| 2d-v | "Educations" → "Education" | About, Background |
| 4d | Added mandate **Six Senses Hotel, Ibiza** — €191,800,000, July 2024, acquisition financing, Spain/Hotel/Europe. Text and photo taken from the current Wix site's credentials slider | Mandates item `six-senses-ibiza` |
| 4d | ParkWest Fund €84M set to Italy / Office (Mauro's press release calls it a "Milan office complex") | Mandates item `parkwest-fund` |
| 5c | Swapped article URLs: "Inside the €330m refinancing…" ↔ "The return of Italy's debt play". Verified by opening both PDFs | Press items `italian-icon-refinancing`, `italy-debt-play` |
| 5d | Interview cards filled: GRI Institute "Hospitality in Europe" (`youtu.be/DrM28g6S5Dw`, 2024-02-27) and Sara Damasceni interview (`youtu.be/_t3Ykqv9fvw`, 2025-10-07). Thumbnails from YouTube uploaded to Webflow assets | Interviews items `gri-hospitality-in-europe`, `sara-damasceni-interview` |

Confirm with Mauro:
- The second video's YouTube title is just "SAVOIA YOUTUBE", so the card is
  titled "In conversation with Sara Damasceni". He should confirm a title.
- He wrote "€250m Four Seasons Hotel in Rome **from 2025**", but the
  Credentials item "Luxury Hotel, Rome" is dated October 2024. The ticker uses
  "2025" with no month.
- He named "Mandarin Oriental Paris" and "Four Seasons Rome", but Credentials
  keeps them anonymised ("Landmark Hotel, Paris", "Luxury Hotel, Rome"). Ask
  whether Credentials can name them too.

## Still open from the 19 Oct additions

- **5e — new press articles.** Waiting on the PDFs from his email: €84m green
  loan for Milan office complex, 2025 Edition Hotel, Gruppo Statuto €205m
  Paris hotel, Gruppo Statuto €400m+ Dior refinancing. He says "three
  articles" but attached four. Each needs publication, date, link and an
  image (Press collection `6a98e370733a6b15e1a965d4`).
- **4d — six mandates still have no country**, so they only appear under
  "All regions": Iconic Hotel DPO Restructuring (2012), Iconic Hotel
  Mediterranean (2016), Iconic Hotel Loan Restructuring (2018), Senior Loan
  Iconic Hotel (2018), Self-Storage Portfolio 2019 and 2021. Their
  descriptions don't name a country — ask Mauro.

## Full comment status

Legend: ✅ done · 🟡 partly · ❌ open · ❓ needs a phone check

### 1 · Homepage
- ❌ 1a New skyline video options with more movement; on phones the banner covers the water
- ❓ 1b Image shakes. The video file is now `homepage-hero-stable`, but this hasn't been checked on a phone
- ✅ 1c "Your Trusted Debt and Equity Advisor"
- ✅ 1d Ticker deals (2026-10-19, unpublished)
- ✅ 1e "handed down to junior bankers"
- ✅ 1f Mauro box opens the bio modal; new title
- ✅ 1g HOME in the nav

### 2 · About
- ✅ 2a New "Over more than a decade…" wording on About. Home still has the older "international banks, global debt and hedge funds" sentence — ask whether it should match
- ✅ 2b $25 billion. The bio modal (People CMS) still says "over 30 years… over Euro 20 billion" while About says "over 25 years… $25 billion" — ask which is right
- ❌ 2c "III – Team". About has no section III (I, II, IV, VI). "Meet the Team" and the "Leadership Team" nav link point at `#leadership-team`, which doesn't exist. A heading "Senior people on every mandate." exists on the page and may be the hidden team section
- ❌ 2d-i Swap the €10bn+ and 6 jurisdictions KPIs (order is still €10bn+, 6, 50+)
- ✅ 2d-ii 50+
- ✅ 2d-iii Map links to `/credentials#credentials-map`
- ❌ 2d-iv Selected mandate cards aren't clickable. All three are also titled "Six Senses Hotel, London" with the same description, including the £235.3M UK retail and €84M ParkWest cards (Home too)
- ✅ 2d-v Education (2026-10-19, unpublished)

### 3 · Services
- ✅ 3a "See related transactions" removed
- ✅ 3b Sizes and recent mandates for all six. 06 is now "Real Estate Capital Markets", but the nav menu, the Home card and the anchor id still say "Real Estate Agency"

### 4 · Credentials
- ✅ 4a KPI banner. The hidden screen-reader text under 50+ and €150–200M is still placeholder ("Deutsche Bank facility", "Three hundred million dollars")
- ✅ 4b Click a marker → "View featured projects" filters the list
- 🟡 4c 41 mandates (was 3) including Ibiza. Photos still low quality — accept Mauro's offer to send originals
- 🟡 4d Ibiza and ParkWest done; six mandates still have no country
- ❌ The Sector focus section still shows the €330M Danieli 2022 deal

### 5 · Press
- ❌ 5a Clicking PRESS only opens the dropdown (About and Services behave the same way)
- ✅ 5b Year filters work
- ✅ 5c Swapped links (2026-10-19, unpublished). Svim San Babila still points at the La Forgiatura article — real URL needed (see AGENTS.md Open decisions)
- ✅ 5d Two videos (2026-10-19, unpublished); more to come from Mauro
- ❌ 5e New articles — waiting on the PDFs
- ❌ Press intro paragraph is still Lorem ipsum

### Other requests in the same email thread
- **Cookie banner.** Mauro asked for one. Not built. Webflow has no native banner; options are Finsweet Cookie Consent, iubenda or Cookiebot. Needs GDPR/Garante rules: equal Accept/Reject, no non-essential cookies before consent, link to the cookie policy
- **Email signature.** See `tools/email-signature/`

## Current Wix credentials (reference)

The Wix site's credentials slider had 39 deals on 2026-10-19. Six Senses
Ibiza was the only one missing from the Webflow Mandates collection.
