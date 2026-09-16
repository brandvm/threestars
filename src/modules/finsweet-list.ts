import { init, type List } from "@finsweet/attributes/dist/src-T7SM3ONB.js";

let started: Promise<List[]> | undefined;

// One List init per page. init() builds an instance for every
// [fs-list-element="list"] it finds, so a second call would wrap the same
// lists again. Every module that needs an instance shares this promise.
export function startLists(): Promise<List[]> {
  if (started) return started;

  // Finsweet's shared option reader checks script-level defaults. An array
  // preserves the standard callback queue if another Attributes module loads.
  const host = window as typeof window & {
    FinsweetAttributes?: { scripts?: HTMLScriptElement[] };
  };
  host.FinsweetAttributes ||= [] as unknown as { scripts: HTMLScriptElement[] };
  host.FinsweetAttributes.scripts ||= [];

  started = init().then(({ result }) => result);
  return started;
}

// Starts List for any Collection List marked in Webflow that no page module
// owns — typically fs-list-load="more" over native pagination, which needs
// nothing beyond the attributes. Call it after the page modules: they set
// attributes init() must see, such as the filters marker on a form.
export function initLists(): void {
  if (!document.querySelector('[fs-list-element="list"]')) return;
  startLists().catch((error: unknown) => {
    // Native pagination stays usable if enhancement fails.
    console.warn("[list] Finsweet List unavailable", error);
  });
}
