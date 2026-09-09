import type Lenis from 'lenis';

/** The homepage-only embed establishes first-paint state before Page Wrapper.
 * Its independent timeout also releases the page if the bundle fails. */
export function initHomePreloader(lenis?: Lenis): void {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>('[data-home-preloader]');
  if (!overlay || !root.classList.contains('has-home-preloader')) {
    root.classList.remove('is-loading');
    return;
  }

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations: Animation[] = [];
  const backgrounds = Array.from(document.body.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement && !node.contains(overlay),
  );
  const inertStates = backgrounds.map(node => node.inert);
  let finished = false;
  let timer: ReturnType<typeof setTimeout>;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
    root.classList.remove('has-home-preloader', 'is-loading');
    backgrounds.forEach((node, index) => { node.inert = inertStates[index]!; });
    lenis?.start();
    document.removeEventListener('ts:preloader-timeout', finish);
    window.removeEventListener('pagehide', finish);
    motion.removeEventListener('change', finish);
    try { sessionStorage.setItem('ts-home-intro-seen', '1'); } catch { /* Storage may be blocked. */ }
  };

  lenis?.stop();
  backgrounds.forEach(node => { node.inert = true; });
  document.addEventListener('ts:preloader-timeout', finish);
  window.addEventListener('pagehide', finish);
  motion.addEventListener('change', finish);
  timer = setTimeout(finish, 6500);
  if (motion.matches) { finish(); return; }

  const animate = (element: Element | null, frames: Keyframe[], duration: number, delay: number,
    easing = 'cubic-bezier(.22,1,.36,1)') => {
    if (!element) throw new Error('Missing preloader artwork');
    const animation = element.animate(frames, { duration, delay, fill: 'both', easing });
    animations.push(animation);
    return animation;
  };

  try {
    // SVG coordinates keep the mark centred, then move it into the lockup.
    const symbol = overlay.querySelector('[data-preloader-symbol]');
    animate(symbol, [{ opacity: 0 }, { opacity: 1 }], 650, 120);
    animate(symbol, [
      { transform: 'translateX(78px)' },
      { transform: 'translateX(0px)' },
    ], 1100, 850);
    overlay.querySelectorAll('[data-preloader-letter]').forEach((letter, index) => {
      // Long, overlapping reveals create a flowing stagger instead of typing.
      animate(letter, [
        { opacity: 0, transform: 'translateY(0.2em)' },
        { opacity: 1, transform: 'translateY(0em)' },
      ], 1000, 1500 + index * 110);
    });
    animate(overlay.querySelector('[data-preloader-subtitle]'), [{ opacity: 0 }, { opacity: 1 }], 750, 3200);
    const exit = animate(overlay, [{ opacity: 1 }, { opacity: 0 }], 1000, 4200,
      'cubic-bezier(.65,.05,0,1)');
    void exit.finished.then(finish, finish);
  } catch {
    finish();
  }
}
