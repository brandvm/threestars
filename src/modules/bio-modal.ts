import type Lenis from 'lenis';

/** Bio modal — one dialog per person, nested inside that person's collection
 *  item so the CMS bindings stay local to it. A trigger opens the dialog that
 *  lives in its own item, which is why the lookup walks up to the item first
 *  rather than querying the document.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function initBioModal(lenis?: Lenis): void {
  let openModal: HTMLElement | null = null;
  let opener: HTMLElement | null = null;
  const inerted: Element[] = [];

  /** Hide everything outside the dialog from assistive tech and the tab
   *  order. Walking up from the dialog and inerting each level's *siblings*
   *  is what makes this work: the dialog sits deep inside the page wrapper,
   *  so inerting the body's children directly would skip the wrapper — it
   *  contains the dialog — and leave the whole page readable behind it.
   *
   *  `inert` rather than aria-hidden: it removes the subtree from the
   *  accessibility tree *and* from the tab order, so it does the job the
   *  focus trap below would otherwise have to do alone. */
  const inertOutside = (modal: HTMLElement): void => {
    let node: Element = modal;
    while (node !== document.body && node.parentElement) {
      for (const sibling of Array.from(node.parentElement.children)) {
        if (sibling !== node && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          inerted.push(sibling);
        }
      }
      node = node.parentElement;
    }
  };

  const releaseInert = (): void => {
    for (const el of inerted) el.removeAttribute('inert');
    inerted.length = 0;
  };

  const show = (modal: HTMLElement, trigger: HTMLElement): void => {
    openModal = modal;
    opener = trigger;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    inertOutside(modal);

    // Lenis animates window scroll itself, so overflow:hidden alone does not
    // stop it — it has to be told. The class covers the reduced-motion case,
    // where initSmoothScroll returns nothing and there is no Lenis to stop.
    document.documentElement.classList.add('bio-lock');
    lenis?.stop();

    const first =
      modal.querySelector<HTMLElement>('.bio-modal-close') ??
      modal.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  };

  const hide = (): void => {
    if (!openModal) return;

    openModal.classList.remove('is-open');
    openModal.setAttribute('aria-hidden', 'true');

    // Before the focus call below: the trigger is a sibling of the dialog
    // inside the collection item, so it is one of the inerted elements and
    // cannot take focus until this runs.
    releaseInert();

    document.documentElement.classList.remove('bio-lock');
    lenis?.start();

    opener?.focus();
    openModal = null;
    opener = null;
  };

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const trigger = target.closest<HTMLElement>('[data-bio-open]');
    if (trigger) {
      const item = trigger.closest('.w-dyn-item') ?? trigger.closest('[role="listitem"]');
      const modal = item?.querySelector<HTMLElement>('.bio-modal');
      if (modal) {
        e.preventDefault();
        show(modal, trigger);
      }
      return;
    }

    if (target.closest('[data-bio-close]')) {
      e.preventDefault();
      hide();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!openModal) return;

    if (e.key === 'Escape') {
      hide();
      return;
    }

    if (e.key !== 'Tab') return;

    // Re-read on every Tab rather than caching: the dialog's contents are
    // CMS-driven, so which links exist differs per person.
    const items = Array.from(openModal.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetWidth || el.offsetHeight || el.getClientRects().length,
    );
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
