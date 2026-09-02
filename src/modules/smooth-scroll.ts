import Lenis from 'lenis';

/** Bundled rather than CDN-loaded: the footer loader appends our script
 *  tag dynamically, so a sibling <script defer> has no ordering promise
 *  and window.Lenis could be undefined by the time we run. */
export function initSmoothScroll(): Lenis | undefined {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  return new Lenis({ autoRaf: true });
}
