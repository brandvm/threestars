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
  /** The dialog currently moved to body, and where to put it back. */
  let portalled: { el: HTMLElement; parent: Node; next: Node | null } | null = null;
  /** Whether the press that started this click landed outside the panel. */
  let pressedOutside = false;
  const inerted: Element[] = [];

  /** Hide everything outside the dialog from assistive tech and the tab
   *  order by inerting each level's *siblings* on the way up to body. With
   *  the dialog portalled to body this is a single pass over body's other
   *  children, but the walk is kept general so it stays correct if the
   *  dialog is ever shown in place.
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

  const restorePortal = (): void => {
    if (!portalled) return;
    portalled.parent.insertBefore(portalled.el, portalled.next);
    portalled = null;
  };

  const show = (modal: HTMLElement, trigger: HTMLElement): void => {
    openModal = modal;
    opener = trigger;

    // Portal to body. position:fixed is only viewport-relative until an
    // ancestor takes a transform, filter or contain — any of those make it
    // the containing block and the dialog would be pinned inside the card
    // instead of the window. The same ancestors create stacking contexts
    // that z-index:900 cannot climb out of. Moving it makes the dialog
    // independent of whatever the Designer does to the collection item.
    //
    // Recorded rather than appended-and-forgotten: the trigger finds its
    // dialog by walking up to the collection item and querying inside it,
    // so a dialog left on body would be unreachable on the second open.
    portalled = { el: modal, parent: modal.parentNode!, next: modal.nextSibling };
    document.body.appendChild(modal);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    // Name the dialog from the heading. It cannot be done in the Designer:
    // aria-label takes no CMS binding on a Block, and aria-labelledby would
    // need an id, which repeats across every item of the collection list and
    // would then resolve to the first person's name for everyone.
    const name = modal.querySelector('.bio-modal-name')?.textContent?.trim();
    if (name) modal.setAttribute('aria-label', name);

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

    // Before the focus call below: the trigger's whole branch is inerted
    // while the dialog is open, so it cannot take focus until this runs.
    releaseInert();

    // The dialog stays on body until the next open. Moving a node cancels
    // the transitions running on it, so putting it back here would cut the
    // fade and scale-down off on their first frame. It is display:none by
    // then either way, so where it sits is invisible.

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
      // Whatever was opened last is still parked on body. Put it back before
      // looking, or the lookup below — which walks up to the collection item
      // and queries inside it — would miss a dialog sitting outside its item.
      restorePortal();

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
      return;
    }

    // Backdrop dismiss. Anything inside the dialog but outside the panel is
    // scrim, so this needs no attribute in the Designer. Both the press and
    // the release have to have landed there — otherwise selecting text in
    // the panel and dragging past its edge would close the dialog on
    // release, which reads as the click being stolen.
    if (
      openModal &&
      pressedOutside &&
      openModal.contains(target) &&
      !target.closest('.bio-modal-panel')
    ) {
      hide();
    }
  });

  document.addEventListener('mousedown', (e) => {
    const target = e.target;
    pressedOutside =
      !!openModal &&
      target instanceof Element &&
      openModal.contains(target) &&
      !target.closest('.bio-modal-panel');
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
