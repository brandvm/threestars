/** Region map camera. Flies the map layer between framed regions when a
 *  .toggle-item is clicked.
 *
 *  Framing comes from the markup: data-europe / data-usa hold
 *  "focusX,focusY,zoom" as percentages, so the Designer owns where each
 *  region sits without touching this file.
 *
 *  The flight is keyframed rather than transitioned because it pulls the
 *  camera back on the way across — a straight interpolation between two
 *  zoomed frames sweeps through the map at full magnification, which reads
 *  as a lurch. Zoom is interpolated in log space (so it feels linear) with
 *  a sine dip toward midZf at the apex.
 *
 *  Paired with the .map-layer / .toggle-* reduced-motion rules in §07 of
 *  styles.css: those kill the CSS transitions, and fly() below bails to a
 *  straight cut for the same query. */

type Vec3 = [number, number, number];
type Frame = { zf: number; tx: number; ty: number };
type Box = { w: number; h: number; cardW: number; cardH: number };
type Centre = { cx: number; cy: number };

const MAP_W = 2039;
const MAP_H = 1344;
const DURATION = 1400;
const FLYOUT = 0.65;
const APEX = 0.5;
const CURVE: [number, number, number, number] = [0.5, 0, 0.35, 1];

/** Cubic-bezier solver: Newton-Raphson on x, then evaluate y. */
function bezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (x: number) => number {
  const A = (a: number, b: number) => 1 - 3 * b + 3 * a;
  const B = (a: number, b: number) => 3 * b - 6 * a;
  const C = (a: number) => 3 * a;
  const f = (t: number, a: number, b: number) =>
    ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
  const d = (t: number, a: number, b: number) =>
    3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);

  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const s = d(t, x1, x2);
      if (!s) break;
      t -= (f(t, x1, x2) - x) / s;
    }
    return f(t, y1, y2);
  };
}

const ease = bezier(CURVE[0], CURVE[1], CURVE[2], CURVE[3]);

function css(f: Frame): string {
  return `translate(${f.tx}%,${f.ty}%) scale(${f.zf})`;
}

function matrixOf(v: string): { a: number; e: number; f: number } | null {
  const m = /matrix\(([^)]+)\)/.exec(v || '');
  if (!m) return null;
  const n = m[1].split(',').map(Number);
  return { a: n[0], e: n[4], f: n[5] };
}

function setupCard(card: HTMLElement): void {
  const found = card.querySelector<HTMLElement>('.map-layer');
  const thumb = card.querySelector<HTMLElement>('.toggle-thumb');
  const items = Array.from(card.querySelectorAll<HTMLElement>('.toggle-item'));
  if (!found || !items.length) return;

  // Rebound so the null check above survives into the closures below;
  // TypeScript does not carry narrowing of a captured const into them.
  const layer = found;

  let region = 'europe';
  let anim: Animation | null = null;
  let sig = '';

  function read(name: string, fallback: Vec3): Vec3 {
    const v = (card.getAttribute(`data-${name}`) || '').split(',').map(Number);
    return v.length === 3 && v.every((n) => !isNaN(n)) ? (v as Vec3) : fallback;
  }

  // Smallest box that fills the card — scale 1 always covers, so the
  // pull-back can never expose background.
  function box(): Box | null {
    const r = card.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const s = Math.max(r.width / MAP_W, r.height / MAP_H);
    return { w: MAP_W * s, h: MAP_H * s, cardW: r.width, cardH: r.height };
  }

  function frame(name: string, b: Box): Frame {
    const v =
      name === 'europe' ? read('europe', [49, 41, 280]) : read('usa', [14.3, 43.7, 140]);
    const zf = Math.max(1, v[2] / 100);
    const fx = v[0] / 100;
    const fy = v[1] / 100;
    return {
      zf,
      tx: 100 * (b.cardW / (2 * b.w) - fx * zf),
      ty: 100 * (b.cardH / (2 * b.h) - fy * zf),
    };
  }

  function centre(f: Frame, b: Box): Centre {
    return {
      cx: (b.cardW / (2 * b.w) - f.tx / 100) / f.zf,
      cy: (b.cardH / (2 * b.h) - f.ty / 100) / f.zf,
    };
  }

  function atCentre(c: Centre, zf: number, b: Box): Frame {
    return {
      zf,
      tx: 100 * (b.cardW / (2 * b.w) - c.cx * zf),
      ty: 100 * (b.cardH / (2 * b.h) - c.cy * zf),
    };
  }

  function sync(): void {
    const b = box();
    if (!b) return;

    const s = `${Math.round(b.w)}x${Math.round(b.h)}`;
    if (s !== sig) {
      sig = s;
      layer.style.width = `${b.w}px`;
      layer.style.height = `${b.h}px`;
      if (!anim) layer.style.transform = css(frame(region, b));
    }

    const on = card.querySelector<HTMLElement>('.toggle-item.is-active');
    if (thumb && on && on.offsetWidth) {
      thumb.style.width = `${on.offsetWidth}px`;
      thumb.style.transform = `translateX(${on.offsetLeft}px)`;
      thumb.style.opacity = '1';
    }
  }

  function fly(from0: string, to0: string): void {
    const b = box();
    if (!b || typeof layer.animate !== 'function') return;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      layer.style.transform = css(frame(to0, b));
      return;
    }

    // Resume from wherever the camera actually is.
    const live =
      anim && anim.playState !== 'idle' && anim.playState !== 'finished'
        ? matrixOf(getComputedStyle(layer).transform)
        : null;
    const from: Frame = live
      ? { zf: live.a, tx: (100 * live.e) / b.w, ty: (100 * live.f) / b.h }
      : frame(from0, b);
    const to = frame(to0, b);

    const near = Math.min(from.zf, to.zf);
    const midZf = near - (near - 1) * FLYOUT;
    const a = centre(from, b);
    const c = centre(to, b);
    const lf = Math.log(from.zf);
    const lt = Math.log(to.zf);
    const warp = (t: number) =>
      t <= APEX ? (0.5 * t) / APEX : 0.5 + (0.5 * (t - APEX)) / (1 - APEX);
    const dip = Math.log(midZf) - (lf + (lt - lf) * ease(APEX));

    const frames: Keyframe[] = [];
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const e = ease(t);
      const zf = Math.exp(
        lf + (lt - lf) * e + dip * Math.pow(Math.sin(Math.PI * warp(t)), 2),
      );
      frames.push({
        offset: t,
        transform: css(
          atCentre(
            { cx: a.cx + (c.cx - a.cx) * e, cy: a.cy + (c.cy - a.cy) * e },
            zf,
            b,
          ),
        ),
      });
    }

    // Shorten the flight when resuming mid-air: the camera only has to
    // cover the distance that is left, not the whole original hop.
    const origin = centre(frame(from0, b), b);
    const whole = Math.hypot(c.cx - origin.cx, c.cy - origin.cy);
    const leftD = Math.hypot(c.cx - a.cx, c.cy - a.cy);
    const k = whole > 1e-4 ? Math.min(1, Math.max(0.45, leftD / whole)) : 1;

    if (anim) anim.cancel();
    layer.style.transform = css(to);
    anim = layer.animate(frames, {
      duration: DURATION * k,
      easing: 'linear',
      fill: 'none',
    });
  }

  for (const btn of items) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const next = btn.getAttribute('data-region');
      if (!next || next === region) return;
      const prev = region;
      region = next;
      for (const b of items) b.classList.toggle('is-active', b === btn);
      sync();
      fly(prev, next);
    });
  }

  for (const b of items) {
    b.classList.toggle('is-active', b.getAttribute('data-region') === region);
  }

  sync();
  if (window.ResizeObserver) new ResizeObserver(sync).observe(card);
  addEventListener('resize', sync);
  setInterval(sync, 500); // covers images/CMS changing card height
  requestAnimationFrame(sync); // first paint has no layout yet
}

export function initRegionMap(): void {
  const cards = document.querySelectorAll<HTMLElement>('.map-card');
  if (!cards.length) return;

  for (const card of cards) setupCard(card);
}
