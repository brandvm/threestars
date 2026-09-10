import type Lenis from 'lenis';

export function initNavigation(lenis?: Lenis): void {
  const nav = document.querySelector<HTMLElement>('.nav-w');
  const menu = nav?.querySelector<HTMLElement>('.nav-links');
  const toggle = nav?.querySelector<HTMLElement>('.nav-toggle');
  if (!nav || !menu || !toggle || nav.dataset.navigationReady) return;
  nav.dataset.navigationReady = 'true';
  const mobile = matchMedia('(max-width: 991px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const groups = Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-dropdown]'));
  const inertStates = new Map<HTMLElement, boolean>();
  let opened = false;
  let visible = false;
  let closeTimer: ReturnType<typeof setTimeout>;
  let menuCloseTimer: ReturnType<typeof setTimeout>;
  menu.inert = mobile.matches;

  function setGroup(group?: HTMLElement) {
    groups.forEach(item => {
      const active = item === group;
      item.toggleAttribute('data-open', active);
      item.querySelector('[data-nav-trigger]')?.setAttribute('aria-expanded', String(active));
    });
  }
  function updateMenuTop() {
    if (visible) nav!.style.setProperty('--nav-menu-top', `${nav!.querySelector('.nav-bar')!.getBoundingClientRect().bottom}px`);
  }
  function finishClose() {
    if (opened) return;
    clearTimeout(menuCloseTimer);
    const wasVisible = visible;
    visible = false;
    nav!.removeAttribute('data-menu-visible');
    document.documentElement.classList.remove('is-nav-open');
    menu!.inert = mobile.matches;
    setGroup();
    inertStates.forEach((value, element) => { element.inert = value; });
    inertStates.clear();
    if (wasVisible) lenis?.start();
  }
  function setOpen(next: boolean, restoreFocus = false, immediate = false) {
    next = next && mobile.matches;
    clearTimeout(menuCloseTimer);
    clearTimeout(closeTimer);
    opened = next;
    toggle!.setAttribute('aria-expanded', String(opened));
    toggle!.setAttribute('aria-label', opened ? 'Close menu' : 'Open menu');
    if (opened) {
      const wasVisible = visible;
      visible = true;
      nav!.setAttribute('data-menu-visible', '');
      document.documentElement.classList.add('is-nav-open');
      menu!.inert = false;
      updateMenuTop();
      if (!wasVisible) {
        setGroup();
        menu!.scrollTop = 0;
        // Establish the displayed, transparent state before transitioning in.
        void menu!.offsetHeight;
      }
      nav!.setAttribute('data-menu-open', '');
      lenis?.stop();
      let branch: HTMLElement = nav!;
      while (branch.parentElement) {
        Array.from(branch.parentElement.children).forEach(sibling => {
          if (sibling !== branch && sibling instanceof HTMLElement && !['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) {
            // Reopening during the exit must preserve the original states.
            if (!inertStates.has(sibling)) inertStates.set(sibling, sibling.inert);
            sibling.inert = true;
          }
        });
        branch = branch.parentElement;
        if (branch === document.body) break;
      }
    } else {
      nav!.removeAttribute('data-menu-open');
      if (restoreFocus || (mobile.matches && menu!.contains(document.activeElement))) toggle!.focus({ preventScroll: true });
      menu!.inert = mobile.matches;
      if (!visible || immediate || reducedMotion.matches) {
        finishClose();
      } else {
        // CSS declares this token in milliseconds. The fallback also handles
        // interrupted transitions and a second tap before the first paint.
        const duration = parseFloat(getComputedStyle(nav!).getPropertyValue('--nav-menu-duration')) || 240;
        menuCloseTimer = setTimeout(finishClose, duration + 80);
      }
    }
  }
  menu.addEventListener('transitionend', event => {
    if (event.target === menu && event.propertyName === 'opacity' && !opened) finishClose();
  });
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
    if (visible && event.key === 'Tab') {
      const elements = Array.from(nav.querySelectorAll<HTMLElement>('a[href],button,[tabindex="0"]')).filter(el => !el.closest('[inert]') && el.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  mobile.addEventListener('change', () => setOpen(false, false, true));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && visible && !opened) finishClose();
  });
  window.addEventListener('resize', updateMenuTop);
  window.addEventListener('pagehide', () => setOpen(false, false, true));

  nav.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      // Release scroll and inert immediately so same-page anchors can navigate.
      if (visible) setOpen(false, false, true);
      setGroup();
    });
  });
}
