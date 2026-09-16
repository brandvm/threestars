import { startLists } from "./finsweet-list";

// Interviews render from the Interviews collection; Show More is Finsweet
// List Load over native pagination. What stays here is the one thing CMS
// binding cannot express: an unconfirmed interview keeps an empty Video URL,
// so its card stays visible but must not link anywhere until a real HTTP(S)
// URL is set.
function prepareCard(card: HTMLElement): void {
  if (card.dataset.interviewChecked) return;
  card.dataset.interviewChecked = "true";

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
}

export function initInterviews(): void {
  const section = document.querySelector<HTMLElement>("[data-interviews]");
  if (!section) return;
  const prepare = (root: ParentNode) => {
    root.querySelectorAll<HTMLElement>("[data-interview-card]").forEach(prepareCard);
  };
  prepare(section);

  // Load More adds cards after boot; each rendered batch needs the same check.
  startLists().then((lists) => {
    const list = lists.find((instance) => section.contains(instance.wrapperElement));
    list?.addHook("afterRender", (items) => {
      for (const { element } of items) prepare(element);
    });
  }).catch(() => {
    // finsweet-list.ts reports the failure; the first page is already prepared.
  });
}
