import type Lenis from 'lenis';

/** Vertical parallax for `.parallax-video`.
 *
 *  The container is the frame: `overflow: hidden` plus a fixed aspect
 *  ratio. The <video> inside it is laid out taller than that frame by the
 *  component's Parallax Video variant, and this module slides it through
 *  the excess as the frame crosses the viewport.
 *
 *  Travel is measured, never configured. The overflow in pixels is the
 *  difference between the two laid-out heights, so the variant's height is
 *  the single source of truth — raise it for a stronger effect and nothing
 *  here needs to change. A hardcoded number here would be a second source
 *  that silently disagrees the moment the CSS moves, and disagreement shows
 *  up as the video detaching from one edge of its frame.
 */

interface Layer {
  container: HTMLElement;
  video: HTMLElement;
  /** Pixels the video exceeds its frame by. Re-measured on resize. */
  overflow: number;
  onScreen: boolean;
}

export function initParallax(lenis?: Lenis): void {
  // initSmoothScroll returns undefined under prefers-reduced-motion. No
  // Lenis means the user asked for less movement, so there is nothing to
  // opt into here either — this is the JS half of the §07 rules.
  if (!lenis) return;

  const layers: Layer[] = [];

  for (const container of document.querySelectorAll<HTMLElement>('.parallax-video')) {
    const video = container.querySelector<HTMLElement>('video');
    if (video) layers.push({ container, video, overflow: 0, onScreen: false });
  }

  if (!layers.length) return;

  let viewport = window.innerHeight;

  const measure = (): void => {
    viewport = window.innerHeight;
    for (const layer of layers) {
      layer.overflow = layer.video.offsetHeight - layer.container.offsetHeight;
    }
  };

  const update = (): void => {
    for (const layer of layers) {
      if (!layer.onScreen || layer.overflow <= 0) continue;

      const rect = layer.container.getBoundingClientRect();

      // 0 as the frame's top touches the bottom of the viewport, 1 as its
      // bottom clears the top. Denominator is the full travel of the frame
      // across the viewport, so the easing is linear in scroll distance.
      const progress = (viewport - rect.top) / (viewport + rect.height);
      const clamped = progress < 0 ? 0 : progress > 1 ? 1 : progress;

      // Bottom-aligned at 0, top-aligned at 1: the video drifts downward
      // relative to its frame as the page scrolls up, so it reads as
      // lagging behind. Running this the other way makes it outrun the
      // page, which looks like a glitch rather than depth.
      const y = -layer.overflow * (1 - clamped);
      layer.video.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    }
  };

  // Off-screen frames cost nothing: getBoundingClientRect forces layout,
  // and on a long page most of them are never in view.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const layer = layers.find((l) => l.container === entry.target);
        if (layer) layer.onScreen = entry.isIntersecting;
      }
      update();
    },
    { rootMargin: '10% 0px' },
  );

  for (const layer of layers) io.observe(layer.container);

  // Bound to Lenis rather than a scroll listener or a rAF of our own.
  // Lenis owns the frame loop (autoRaf) and writes scroll position on its
  // own schedule; reading position from an independent loop can land
  // before that write and lag it by a frame, which is visible as jitter on
  // exactly the slow scroll where parallax is most obvious.
  lenis.on('scroll', update);

  addEventListener('resize', () => {
    measure();
    update();
  });

  measure();
  update();
}
