import { init as initList, type ListItem } from "@finsweet/attributes/dist/src-T7SM3ONB.js";

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

  // Finsweet's shared option reader checks script-level defaults. An array
  // preserves the standard callback queue if another Attributes module loads.
  const host = window as typeof window & {
    FinsweetAttributes?: { scripts?: HTMLScriptElement[] };
  };
  host.FinsweetAttributes ||= [] as unknown as { scripts: HTMLScriptElement[] };
  host.FinsweetAttributes.scripts ||= [];

  void initList().then(({ result }) => {
    const list = result.find((instance) => section.contains(instance.wrapperElement));
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
