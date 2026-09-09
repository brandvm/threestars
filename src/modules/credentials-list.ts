import { init as initList, type ListItem } from "@finsweet/attributes/dist/src-T7SM3ONB.js";

const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "long", year: "numeric",
});

function formatDates(items: ListItem[]): void {
  for (const { element } of items) {
    const value = element.dataset.mandateDate;
    const label = element.querySelector<HTMLElement>(".mandate-card-date .meta");
    if (!value || !label) continue;
    // Webflow publishes the date in the site's timezone; retain that month.
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) label.textContent = monthYear.format(date);
  }
}

// Import only List from the pinned, prebundled Attributes v2 distribution.
// Webflow owns the form, collection query, card bindings and pagination.
export function initCredentialsList(): void {
  const section = document.querySelector<HTMLElement>("[data-credentials-list]");
  const form = section?.querySelector<HTMLFormElement>("form");
  if (!section || !form || section.dataset.listInitialized) return;
  section.dataset.listInitialized = "true";

  // Webflow's Form settings can attach custom attributes to its wrapper.
  // Finsweet needs the filters marker on the actual form element.
  form.setAttribute("fs-list-element", "filters");
  form.setAttribute("fs-list-activeclass", "is-active");
  form.addEventListener("submit", (event) => event.preventDefault());

  const inputs = [...form.querySelectorAll<HTMLInputElement>("input[data-country-filter]")];
  const count = section.querySelector<HTMLElement>('[fs-list-element="results-count"]');
  const countLabel = section.querySelector<HTMLElement>("[data-credentials-count-label]");
  let pendingCountry: string | undefined;
  let ready = false;

  function syncControls(): void {
    for (const input of inputs) {
      input.closest(".credentials-filter")?.classList.toggle("is-active", input.checked);
    }
    if (count && countLabel) {
      countLabel.textContent = count.textContent?.trim() === "1" ? "MANDATE" : "MANDATES";
    }
  }

  function selectCountry(country: string): void {
    const input = inputs.find((control) => control.dataset.countryFilter === country);
    if (!input) return;
    // Native activation emits both input and change. Finsweet listens to
    // input by default; changing checked alone only updates the pill.
    input.click();
    syncControls();
  }

  section.addEventListener("credentials:filter", (event) => {
    const country = (event as CustomEvent<{ country?: string }>).detail?.country;
    if (!country || !inputs.some((input) => input.dataset.countryFilter === country)) return;
    pendingCountry = country;
    if (ready) selectCountry(country);
  });
  form.addEventListener("change", syncControls);
  if (count) {
    new MutationObserver(syncControls).observe(count, {
      childList: true, characterData: true, subtree: true,
    });
  }
  syncControls();

  // Track the visible navbar edge, including its compact scrolled state.
  const nav = document.querySelector<HTMLElement>(".nav-w");
  const bar = section.querySelector<HTMLElement>(".credentials-filters-bar");
  let frame = 0;
  function positionBar(): void {
    frame = 0;
    if (!bar) return;
    const bottom = Math.max(0, nav?.getBoundingClientRect().bottom || 0);
    const fontSize = parseFloat(getComputedStyle(section!).fontSize) || 16;
    section!.style.setProperty("--credentials-sticky-top", `${bottom / fontSize}em`);
  }
  function schedulePosition(): void {
    if (!frame) frame = requestAnimationFrame(positionBar);
  }
  if (nav) new ResizeObserver(schedulePosition).observe(nav);
  window.addEventListener("scroll", schedulePosition, { passive: true });
  window.addEventListener("resize", schedulePosition);
  positionBar();

  // Finsweet's shared option reader checks script-level defaults. An array
  // preserves the standard callback queue if another Attributes module loads.
  const host = window as typeof window & {
    FinsweetAttributes?: { scripts?: HTMLScriptElement[] };
  };
  host.FinsweetAttributes ||= [] as unknown as { scripts: HTMLScriptElement[] };
  host.FinsweetAttributes.scripts ||= [];

  void initList().then(({ result }) => {
    const list = result.find((instance) => section.contains(instance.wrapperElement));
    if (!list) throw new Error("Credentials list instance was not created");
    list.addHook("afterRender", (items) => {
      formatDates(items);
      syncControls();
      schedulePosition();
    });
    formatDates(list.items.value);
    ready = true;
    section.dataset.listReady = "true";
    if (pendingCountry) selectCountry(pendingCountry);
    syncControls();
  }).catch((error: unknown) => {
    // The native collection and pagination remain usable if enhancement fails.
    console.warn("[credentials] List enhancement unavailable", error);
  });
}
