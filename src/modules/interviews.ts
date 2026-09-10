/** Native Webflow cards stay editable; only link readiness and disclosure live here. */
export function initInterviews(): void {
  document.querySelectorAll<HTMLElement>("[data-interviews]").forEach((section) => {
    if (section.dataset.interviewsInitialized) return;
    const list = section.querySelector<HTMLElement>("[data-interviews-list]");
    const more = section.querySelector<HTMLButtonElement>("[data-interviews-more]");
    if (!list || !more) return;
    section.dataset.interviewsInitialized = "true";

    const cards = Array.from(list.querySelectorAll<HTMLElement>("[data-interview-card]"));
    const status = section.querySelector<HTMLElement>("[data-interviews-status]");
    const pageSize = 4;
    let shown = Math.min(pageSize, cards.length);

    cards.forEach((card, index) => {
      card.hidden = index >= shown;
      const link = card.querySelector<HTMLAnchorElement>("[data-interview-link]");
      if (!link) return;
      const href = link.getAttribute("href")?.trim() ?? "";
      let ready = false;
      try {
        ready = ["https:", "http:"].includes(new URL(href).protocol);
      } catch { /* Empty and placeholder URLs are intentionally inactive. */ }

      if (!ready) {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.tabIndex = -1;
        link.title = "Interview video to be confirmed";
        return;
      }

      card.dataset.interviewReady = "true";
      link.href = href;
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
      link.removeAttribute("title");
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const title = card.querySelector("h3")?.textContent?.trim();
      link.setAttribute("aria-label", `Watch interview${title ? `: ${title}` : ""} (opens in a new tab)`);
    });

    more.disabled = shown >= cards.length;
    if (more.disabled) more.title = "No additional interviews to show yet";
    else more.removeAttribute("title");
    if (status) {
      const pending = cards.length > 0 && cards.every((card) => !card.dataset.interviewReady);
      status.textContent = `Showing ${shown} of ${cards.length} interviews.${pending ? " Video links are to be confirmed." : ""}`;
    }

    more.addEventListener("click", () => {
      const firstNew = cards[shown];
      if (!firstNew) return;
      shown = Math.min(shown + pageSize, cards.length);
      cards.forEach((card, index) => { card.hidden = index >= shown; });
      if (status) status.textContent = `Showing ${shown} of ${cards.length} interviews.`;

      // Keep keyboard users beside the newly revealed content, including placeholders.
      const target = firstNew.querySelector<HTMLElement>("[data-interview-link][href]") ?? firstNew;
      if (target === firstNew) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (shown === cards.length) {
        more.disabled = true;
        const wrapper = more.closest<HTMLElement>(".interviews-more");
        if (wrapper) wrapper.hidden = true;
        else more.hidden = true;
      }
    });
  });
}
