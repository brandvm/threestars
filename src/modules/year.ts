/** Copyright year. Rewrites every [data-year] / .js-year to this year.
 *
 *  Two selectors on purpose: Webflow Text Spans accept classes but not
 *  custom attributes, so an inline year inside a sentence has to be
 *  .js-year. The attribute is there for anything that is its own element.
 *
 *  Why the markup still carries a hardcoded year: crawlers and no-JS
 *  readers then get a real, correct one, and the notice never renders
 *  blank. This only stops it going stale — without JS it is at worst a
 *  year behind. */
export function initYear(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-year], .js-year');
  if (!els.length) return;

  const year = String(new Date().getFullYear());
  for (const el of els) {
    if (el.textContent !== year) el.textContent = year;
  }
}
