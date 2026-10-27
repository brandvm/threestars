/** Cookie consent — a custom banner driving Google Consent Mode v2.
 *
 *  The split with the head snippet (loader.html, piece 1) matters. The head
 *  sets the consent *default* before GTM loads: denied, or granted when the
 *  visitor's saved choice says so. It has to be inline in the head because
 *  the bundle arrives async, long after GTM has made its first decision.
 *  This module only handles the banner and *changes* of mind.
 *
 *  Markup hooks (G | Cookie Banner, plus a footer link):
 *    [data-consent-banner]  the banner, display:none in the Designer
 *    [data-consent-accept]  grants analytics
 *    [data-consent-reject]  denies analytics — the close X carries it too,
 *                           because the Garante treats closing as rejecting
 *    [data-consent-open]    reopens the banner (footer "Cookie settings")
 *
 *  The choice lives in a first-party cookie for six months. That is the
 *  Garante's minimum before asking a visitor who rejected again, and the
 *  same span for an accept keeps one rule. Bumping VERSION re-asks
 *  everyone; do that when the cookie policy adds a new purpose.
 *
 *  If the bundle never loads the banner never shows, the default stays
 *  denied and nothing tracks — the safe way to fail.
 */

const COOKIE = 'ts-consent';
/** Must match the version the head snippet accepts. */
const VERSION = 1;
const MAX_AGE = 60 * 60 * 24 * 183;

interface Consent {
  v: number;
  analytics: boolean;
  /** When the choice was made, as evidence on the visitor's side. */
  t: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const read = (): Consent | null => {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  if (!m) return null;
  try {
    const c = JSON.parse(decodeURIComponent(m[1])) as Consent;
    return c.v === VERSION ? c : null;
  } catch {
    return null;
  }
};

const write = (analytics: boolean): void => {
  const value: Consent = { v: VERSION, analytics, t: new Date().toISOString() };
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${COOKIE}=${encodeURIComponent(JSON.stringify(value))}` +
    `; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
};

/** gtag() is only a dataLayer push; defined here rather than relying on the
 *  head snippet's global, so a missing snippet cannot throw. It has to push
 *  the `arguments` object itself — GTM ignores a plain array. */
function gtag(..._args: unknown[]): void {
  (window.dataLayer = window.dataLayer || []).push(arguments);
}

/** GA sets _ga and _ga_<id> on the widest domain it can, so a revoke has to
 *  clear them on every parent of the host, not just the host itself. */
const clearAnalyticsCookies = (): void => {
  const names = document.cookie
    .split('; ')
    .map((c) => c.split('=')[0])
    .filter((n) => n === '_ga' || n.startsWith('_ga_') || n === '_gid');
  if (!names.length) return;

  const parts = location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; Domain=.${parts.slice(i).join('.')}`);

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
    }
  }
};

export function initCookieConsent(): void {
  const banner = document.querySelector<HTMLElement>('[data-consent-banner]');
  if (!banner) return;

  // Canvas-only preview switch (see styles.css §08). Never let it reach a visitor.
  banner.removeAttribute('data-consent-preview');

  const show = (focus: boolean): void => {
    banner.classList.add('is-open');
    // Not a dialog: the page stays usable behind it (no cookie wall), so no
    // focus trap and no inert. Focus only moves when the visitor asked for
    // the banner, from the footer link — never on page load.
    if (focus) banner.querySelector<HTMLElement>('[data-consent-accept]')?.focus();
  };

  const hide = (): void => {
    banner.classList.remove('is-open');
  };

  const choose = (analytics: boolean): void => {
    write(analytics);
    gtag('consent', 'update', { analytics_storage: analytics ? 'granted' : 'denied' });
    // The GA4 tag's trigger in GTM listens for this, so an accept counts the
    // page it happened on instead of waiting for the next page view.
    window.dataLayer!.push({ event: 'ts_consent_update', ts_analytics: analytics });
    // Every reject, not only a change of mind: _ga can outlive ts-consent
    // (a VERSION bump, or a visitor who cleared just that cookie).
    if (!analytics) clearAnalyticsCookies();
    hide();
  };

  // On Home the intro owns the screen first. Wait for has-home-preloader to
  // leave <html> rather than for an event from home-preloader.ts: the head
  // bootstrap's own timeout removes the class too, so this still fires when
  // the bundle's intro never ran.
  if (!read()) {
    const root = document.documentElement;
    if (root.classList.contains('has-home-preloader')) {
      const observer = new MutationObserver(() => {
        if (root.classList.contains('has-home-preloader')) return;
        observer.disconnect();
        show(false);
      });
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    } else {
      show(false);
    }
  }

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    if (target.closest('[data-consent-accept]')) {
      e.preventDefault();
      choose(true);
    } else if (target.closest('[data-consent-reject]')) {
      e.preventDefault();
      choose(false);
    } else if (target.closest('[data-consent-open]')) {
      e.preventDefault();
      show(true);
    }
  });

  // Escape dismisses, which counts as rejecting — the same as the X.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && banner.classList.contains('is-open') && banner.contains(document.activeElement)) {
      choose(false);
    }
  });
}
