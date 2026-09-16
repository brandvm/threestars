import type Lenis from 'lenis';

type WebflowGlobal = { push?(callback: () => void): void };
type JQueryGlobal = (target: Document) => { off(events: string): void };

// The header is sticky, so an in-page target needs its height as
// scroll-margin-top. That height is not a constant worth restating: the
// topbar is hidden below 992px, Nav/Height changes per breakpoint, and the
// root font-size is fluid. Measure it instead. Written in px because a
// measured value keeps its native unit — and an em inside a custom property
// would resolve against each target's own font-size, not the header's.
function trackHeaderHeight(header: HTMLElement): void {
  const root = document.documentElement;
  const write = () => {
    root.style.setProperty('--nav-h', `${header.getBoundingClientRect().height}px`);
  };
  new ResizeObserver(write).observe(header);
  write();
}

function targetFor(hash: string): HTMLElement | null {
  if (hash.length < 2) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null; // Malformed percent-encoding.
  }
}

// Webflow's scroll module owns every same-page hash link by default. It
// subtracts the height of `header` only when that header is position: fixed,
// and this one is sticky, so it scrolls targets flush to the top — under the
// nav — and never reads scroll-margin-top. It is bound under a jQuery
// namespace, so this removes exactly that handler and nothing else.
function releaseWebflowAnchors(): void {
  const host = window as typeof window & { Webflow?: WebflowGlobal; jQuery?: JQueryGlobal };
  const off = () => host.jQuery?.(document).off('click.wf-scroll');
  off();
  // Its ready callback may not have run yet when the bundle boots.
  host.Webflow?.push?.(off);
}

// Browsers focus nothing on an in-page jump, which leaves a keyboard user's
// next Tab back at the link. Moving focus to the target is what Webflow's
// handler did; keep it without the focus ring on a non-interactive section.
function focusTarget(target: HTMLElement): void {
  const hadTabindex = target.hasAttribute('tabindex');
  if (!hadTabindex) target.setAttribute('tabindex', '-1');
  target.setAttribute('data-anchor-target', '');
  target.focus({ preventScroll: true });
  target.addEventListener('blur', () => {
    target.removeAttribute('data-anchor-target');
    if (!hadTabindex) target.removeAttribute('tabindex');
  }, { once: true });
}

function scrollToTarget(target: HTMLElement, lenis: Lenis | undefined, immediate: boolean): void {
  if (lenis) {
    // Lenis subtracts the target's scroll-margin-top itself. resize() first:
    // its scroll limit is cached, and a stale one clamps the destination.
    lenis.resize();
    lenis.scrollTo(target, {
      immediate,
      force: true,
      onComplete: immediate ? undefined : () => focusTarget(target),
    });
    return;
  }
  // No Lenis means reduced motion, so the native jump is the right one.
  target.scrollIntoView({ block: 'start' });
  if (!immediate) focusTarget(target);
}

// A fragment in the URL on arrival gets no reliable native jump here: the
// boot scroll lock (html.is-loading) clips html and body to the viewport, so
// the browser scrolls the wrong box or nothing, and the lock's release resets
// it. Re-settle once the lock is gone, and again after load in case images
// above the target move it — unless the reader has already taken over.
function settleArrivalHash(lenis: Lenis | undefined): void {
  const target = targetFor(location.hash);
  if (!target) return;

  let interrupted = false;
  const interrupt = () => { interrupted = true; };
  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) {
    window.addEventListener(type, interrupt, { once: true, passive: true });
  }
  const settle = () => {
    if (!interrupted) scrollToTarget(target, lenis, true);
  };

  const root = document.documentElement;
  const unlocked = () => {
    requestAnimationFrame(settle);
    if (document.readyState !== 'complete') window.addEventListener('load', settle, { once: true });
  };
  if (!root.classList.contains('is-loading')) return unlocked();
  const observer = new MutationObserver(() => {
    if (root.classList.contains('is-loading')) return;
    observer.disconnect();
    unlocked();
  });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
}

export function initAnchorScroll(lenis?: Lenis): void {
  const header = document.querySelector<HTMLElement>('.nav-w');
  if (header) trackHeaderHeight(header);

  releaseWebflowAnchors();

  // Bubble phase on document: link-level listeners, such as the mobile menu
  // closing and releasing its scroll lock, have already run by now. Anything
  // that handled the click itself calls preventDefault, and is left alone.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.hasAttribute('download') || link.classList.contains('w-tab-link')) return;
    if (link.target && link.target !== '_self') return;

    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const target = targetFor(url.hash);
    if (!target) return;

    event.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    scrollToTarget(target, lenis, false);
  });

  settleArrivalHash(lenis);
}
