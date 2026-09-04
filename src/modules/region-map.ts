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
/** Ceiling for the layer's laid-out size. Anything past this goes to
 *  scale() instead, so an extreme card aspect cannot ask the compositor
 *  for a raster no GPU will allocate. */
const MAX_RASTER = 4096;

/** Clamp a pan so the layer's own edges can never come inside the card.
 *
 *  tx/ty are percentages of the layer's unscaled box, and the transform
 *  origin is the top left, so the layer covers [tx_px, tx_px + w * zf].
 *  Holding tx at or below 0 keeps the left edge off-card, and at or above
 *  cardW - w * zf keeps the right edge off-card. box() guarantees
 *  w >= cardW at zf 1 and zf never drops below 1, so the range is never
 *  inverted. */
function bound(tx: number, ty: number, zf: number, b: Box): Frame {
  return {
    zf,
    tx: Math.min(0, Math.max((100 * (b.cardW - b.w * zf)) / b.w, tx)),
    ty: Math.min(0, Math.max((100 * (b.cardH - b.h * zf)) / b.h, ty)),
  };
}

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
  /** Whether the layer is laid out at full size (sharp) rather than
   *  scaled up from the unscaled box (soft, but what the keyframes need). */
  let atRest = false;

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
    // Bounded last, so anything that adjusts the authored point before
    // this still cannot push the frame off the map.
    return bound(
      100 * (b.cardW / (2 * b.w) - fx * zf),
      100 * (b.cardH / (2 * b.h) - fy * zf),
      zf,
      b,
    );
  }

  function centre(f: Frame, b: Box): Centre {
    return {
      cx: (b.cardW / (2 * b.w) - f.tx / 100) / f.zf,
      cy: (b.cardH / (2 * b.h) - f.ty / 100) / f.zf,
    };
  }

  /** Every one of the 48 keyframes comes through here, so this is where
   *  the dip matters most: pulling the camera back widens the window, and
   *  an unbounded midpoint walks the map edge into view halfway across. */
  function atCentre(c: Centre, zf: number, b: Box): Frame {
    return bound(
      100 * (b.cardW / (2 * b.w) - c.cx * zf),
      100 * (b.cardH / (2 * b.h) - c.cy * zf),
      zf,
      b,
    );
  }

  /** Park the layer at its final visual size with no scale left over.
   *
   *  The mask rasterises at the layer's *layout* size, so a box laid out
   *  at b.w and blown up by scale(2.8) is a 2.8x upscale of that raster —
   *  fine on a desktop where the raster is already large, visibly soft on
   *  a phone where it is not. Laying it out at the size it will actually
   *  occupy makes the mask sharp again.
   *
   *  tx/ty are percentages of that layout box, so resizing the box changes
   *  what they mean: the same numbers against a box zf times wider would
   *  pan zf times too far. Rescaling by b.w / L is what keeps the camera
   *  pointing at the same place.
   *
   *  MAX_RASTER caps the box and hands the remainder back to scale(), so a
   *  tall narrow card at high zoom degrades to the old softness rather
   *  than asking for a raster the compositor will refuse. */
  function rest(f: Frame, b: Box): void {
    const fit = Math.min(1, MAX_RASTER / Math.max(b.w * f.zf, b.h * f.zf));
    const l = b.w * f.zf * fit;
    const h = b.h * f.zf * fit;
    layer.style.width = `${l}px`;
    layer.style.height = `${h}px`;
    layer.style.transform = `translate(${(f.tx * b.w) / l}%,${
      (f.ty * b.h) / h
    }%) scale(${1 / fit})`;
    atRest = true;
  }

  /** The keyframes are written against the unscaled box, so the layer has
   *  to be back at b.w x b.h before one plays. */
  function flightLayout(b: Box): void {
    layer.style.width = `${b.w}px`;
    layer.style.height = `${b.h}px`;
    atRest = false;
  }

  function flying(): boolean {
    return !!anim && anim.playState !== 'idle' && anim.playState !== 'finished';
  }

  function sync(): void {
    const b = box();
    if (!b) return;

    const s = `${Math.round(b.w)}x${Math.round(b.h)}`;
    if (s !== sig) {
      sig = s;
      if (flying()) flightLayout(b);
      else rest(frame(region, b), b);
    } else if (!flying() && !atRest) {
      // The poll that catches a flight whose onfinish never ran — a
      // backgrounded tab, or an animation cancelled out from under it.
      // Left alone the layer stays scaled, which is the soft state.
      rest(frame(region, b), b);
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
      rest(frame(to0, b), b);
      return;
    }

    // Resume from wherever the camera actually is.
    const live = flying() ? matrixOf(getComputedStyle(layer).transform) : null;
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
    // After `live` is read, so resuming still measures the flight box.
    flightLayout(b);
    layer.style.transform = css(to);
    anim = layer.animate(frames, {
      duration: DURATION * k,
      easing: 'linear',
      fill: 'none',
    });

    // Back to the sharp layout the moment the camera settles. sync()'s
    // poll is the backstop for when this never fires.
    const settled = anim;
    anim.onfinish = () => {
      if (anim !== settled) return;
      const now = box();
      if (now) rest(frame(region, now), now);
    };
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
