import type Lenis from 'lenis';

export function initNavigation(lenis?: Lenis): void {
  const nav = document.querySelector<HTMLElement>('.nav-w');
  const menu = nav?.querySelector<HTMLElement>('.nav-links');
  const toggle = nav?.querySelector<HTMLElement>('.nav-toggle');
  if (!nav || !menu || !toggle || nav.dataset.navigationReady) return;
  nav.dataset.navigationReady = 'true';
  const mobile = matchMedia('(max-width: 991px)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const groups = Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-dropdown]'));
  const inertStates = new Map<HTMLElement, boolean>();
  let opened = false;
  let closeTimer: ReturnType<typeof setTimeout>;

  function setGroup(group?: HTMLElement) {
    groups.forEach(item => {
      const active = item === group;
      item.toggleAttribute('data-open', active);
      item.querySelector('[data-nav-trigger]')?.setAttribute('aria-expanded', String(active));
    });
  }
  function setOpen(next: boolean, restoreFocus = false) {
    opened = next && mobile.matches;
    nav!.toggleAttribute('data-menu-open', opened);
    if (opened) nav!.style.setProperty('--nav-menu-top', `${nav!.querySelector('.nav-bar')!.getBoundingClientRect().bottom}px`);
    document.documentElement.classList.toggle('is-nav-open', opened);
    toggle!.setAttribute('aria-expanded', String(opened));
    toggle!.setAttribute('aria-label', opened ? 'Close menu' : 'Open menu');
    setGroup();
    if (opened) {
      lenis?.stop();
      let branch: HTMLElement = nav!;
      while (branch.parentElement) {
        Array.from(branch.parentElement.children).forEach(sibling => {
          if (sibling !== branch && sibling instanceof HTMLElement && !['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) {
            inertStates.set(sibling, sibling.inert);
            sibling.inert = true;
          }
        });
        branch = branch.parentElement;
        if (branch === document.body) break;
      }
    } else {
      inertStates.forEach((value, element) => { element.inert = value; });
      inertStates.clear();
      lenis?.start();
      if (restoreFocus) toggle!.focus();
    }
  }
  toggle.addEventListener('click', event => { event.preventDefault(); setOpen(!opened); });
  toggle.addEventListener('keydown', event => {
    if (toggle.tagName !== 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault(); setOpen(!opened);
    }
  });
  groups.forEach(group => {
    const trigger = group.querySelector<HTMLElement>('[data-nav-trigger]')!;
    trigger.addEventListener('click', event => {
      event.preventDefault(); clearTimeout(closeTimer);
      setGroup(group.hasAttribute('data-open') ? undefined : group);
    });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault(); setGroup(group); group.querySelector<HTMLElement>('[data-nav-panel] a')?.focus();
      } else if (trigger.tagName !== 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault(); trigger.click();
      }
    });
    group.addEventListener('pointerenter', () => {
      clearTimeout(closeTimer);
      if (!mobile.matches && hover.matches) setGroup(group);
    });
    group.addEventListener('pointerleave', () => {
      if (!mobile.matches && hover.matches) closeTimer = setTimeout(() => {
        if (!group.contains(document.activeElement)) setGroup();
      }, 180);
    });
    group.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!mobile.matches && !group.contains(document.activeElement) && !group.matches(':hover')) setGroup();
      });
    });
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target as Node)) { setGroup(); if (opened) setOpen(false); }
  });
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const active = groups.find(group => group.hasAttribute('data-open'));
      if (active) { setGroup(); active.querySelector<HTMLElement>('[data-nav-trigger]')?.focus(); }
      else if (opened) setOpen(false, true);
      event.preventDefault();
    }
    if (opened && event.key === 'Tab') {
      const elements = Array.from(nav.querySelectorAll<HTMLElement>('a[href],button,[tabindex="0"]')).filter(el => el.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  mobile.addEventListener('change', () => { clearTimeout(closeTimer); setOpen(false); });
  window.addEventListener('pagehide', () => setOpen(false));

  nav.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (opened) setOpen(false);
      setGroup();

    });
  });
}
