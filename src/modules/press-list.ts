import type { ListItem } from "@finsweet/attributes/dist/src-T7SM3ONB.js";
import { startLists } from "./finsweet-list";

// Older coverage is dated more loosely than a date field can express — a
// quarterly runs as "Autumn 2021", a monthly prints only its month. Those
// items carry a Date Label in the CMS; everything else keeps Webflow's
// formatted date. The label rides in a hidden bound block per item because
// a collection item cannot take a CMS-bound custom attribute.
function applyDateLabels(items: ListItem[]): void {
  for (const { element } of items) {
    const label = element.querySelector<HTMLElement>("[data-press-date-label]");
    const date = element.querySelector<HTMLElement>("[data-press-date]");
    const text = label?.textContent?.trim();
    if (!text || !date) continue;
    date.textContent = text;
  }
}

// Import only List from the pinned, prebundled Attributes v2 distribution,
// the same one the credentials list uses. Webflow owns the form, collection
// query, card bindings and pagination.
export function initPressList(): void {
  const section = document.querySelector<HTMLElement>("[data-press-list]");
  const form = section?.querySelector<HTMLFormElement>("form");
  if (!section || !form || section.dataset.listInitialized) return;
  section.dataset.listInitialized = "true";

  // Webflow's Form settings can attach custom attributes to its wrapper.
  // Finsweet needs the filters marker on the actual form element.
  form.setAttribute("fs-list-element", "filters");
  form.setAttribute("fs-list-activeclass", "is-active");
  form.addEventListener("submit", (event) => event.preventDefault());

  const inputs = [...form.querySelectorAll<HTMLInputElement>("input[data-year-filter]")];

  // The pills share the credentials filter class, so :has(input:checked)
  // already paints them. This keeps the class in step for anything that
  // reads it, and for browsers that render the list before the filter runs.
  function syncControls(): void {
    for (const input of inputs) {
      input.closest(".credentials-filter")?.classList.toggle("is-active", input.checked);
    }
  }
  form.addEventListener("change", syncControls);
  syncControls();

  startLists().then((lists) => {
    const list = lists.find((instance) => section.contains(instance.wrapperElement));
    if (!list) throw new Error("Press list instance was not created");
    list.addHook("afterRender", (items) => {
      applyDateLabels(items);
      syncControls();
    });
    applyDateLabels(list.items.value);
    section.dataset.listReady = "true";
    syncControls();
  }).catch((error: unknown) => {
    // The native collection and pagination remain usable if enhancement fails.
    console.warn("[press] List enhancement unavailable", error);
  });
}
