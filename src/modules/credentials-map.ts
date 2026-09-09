/** Country selection for the Credentials hero. The homepage's animated
 * region camera remains independent. Coordinates belong to the Webflow
 * markup and use the original 2039 × 1344 SVG's coordinate system. */
import { createCredentialsCamera } from './credentials-camera';
import type Lenis from 'lenis';

const MAP_WIDTH = 2039;
const MAP_HEIGHT = 1344;
let cardId = 0;

function setupHero(hero: HTMLElement, lenis?: Lenis): void {
  if (hero.dataset.credentialsReady) return;
  const scene = hero.querySelector<HTMLElement>('.credentials-map-scene');
  const image = hero.querySelector<HTMLImageElement>('img.credentials-map-image');
  const card = hero.querySelector<HTMLElement>('.credentials-country-card');
  const title = card?.querySelector<HTMLElement>('h2');
  const summary = card?.querySelector<HTMLElement>('p');
  const markers = Array.from(hero.querySelectorAll<HTMLElement>('.credentials-marker[data-country]'));
  if (!scene || !image || !card || !title || !markers.length) return;
  hero.dataset.credentialsReady = 'true';

  const mobile = matchMedia('(max-width: 767px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const viewport = hero.querySelector<HTMLElement>('.credentials-map-viewport');
  const tablist = hero.querySelector<HTMLElement>('.credentials-markers');
  const camera = viewport ? createCredentialsCamera(viewport, image, reducedMotion) : null;
  let selected = markers[0];
  let requested: HTMLElement | null = null;
  let hovered: HTMLElement | null = null;
  let hoveringCard = false;
  let suppressed: HTMLElement | null = null;
  let closeTimer = 0;
  let pendingFrame = 0;
  let revision = 0;
  let animation: Animation | undefined;
  let countryShapes: SVGElement[] = [];
  card.id ||= `credentials-country-card-${++cardId}`;
  card.dataset.state = 'closed';
  card.setAttribute('aria-hidden', 'true');
  card.inert = true;

  // Preserve the authored SVG image through breakpoint changes. Only the
  // mobile label is generated; replacing marker.textContent would erase
  // the image every time the map is resized.
  for (const marker of markers) {
    const label = document.createElement('span');
    label.className = 'credentials-marker-label';
    label.setAttribute('aria-hidden', 'true');
    label.textContent = marker.getAttribute('aria-label') || '';
    marker.append(label);
    marker.id ||= `${card.id}-${marker.dataset.country}`;
    marker.setAttribute('aria-controls', card.id);
  }

  function position(): void {
    pendingFrame = 0;
    if (!scene || !image || !card) return;
    const imageWidth = image.offsetWidth;
    if (!mobile.matches && !imageWidth) return;
    // The SVG's intrinsic height is zero until it downloads. Its known
    // aspect ratio gives the final geometry even on the first frame.
    const imageHeight = imageWidth * MAP_HEIGHT / MAP_WIDTH;
    for (const marker of markers) {
      if (mobile.matches) {
        marker.style.removeProperty('left');
        marker.style.removeProperty('top');
        continue;
      }
      const x = Number(marker.dataset.mapX);
      const y = Number(marker.dataset.mapY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      marker.style.left = `${image.offsetLeft + imageWidth * x / MAP_WIDTH}px`;
      marker.style.top = `${image.offsetTop + imageHeight * y / MAP_HEIGHT}px`;
    }
    if (mobile.matches) {
      card.style.removeProperty('left');
      card.style.removeProperty('top');
      if (requested) camera?.sync(requested);
      return;
    }
    const x = Number.parseFloat(selected.style.left);
    const y = Number.parseFloat(selected.style.top);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const margin = 20;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const radius = selected.offsetWidth / 2;
    const gap = 8;
    const intro = hero.querySelector<HTMLElement>('.credentials-intro');
    const sceneTop = scene.getBoundingClientRect().top;
    const introBottom = intro ? intro.getBoundingClientRect().bottom - sceneTop : 0;
    const visibleTop = Math.max(margin, introBottom + margin, margin - sceneTop);
    const visibleBottom = Math.min(scene.clientHeight, window.innerHeight - sceneTop) - margin;
    // Stay next to this dot. Prefer above, then try the other sides when
    // the card would cover another control or run outside the scene.
    const candidates = [
      { left: x - width / 2, top: y - radius - gap - height },
      { left: x - width / 2, top: y + radius + gap },
      { left: x - radius - gap - width, top: y - height / 2 },
      { left: x + radius + gap, top: y - height / 2 },
    ];
    const score = ({ left, top }: { left: number; top: number }): number => {
      const overflow = Math.max(0, margin - left) + Math.max(0, visibleTop - top)
        + Math.max(0, left + width + margin - scene.clientWidth)
        + Math.max(0, top + height - visibleBottom);
      const covered = markers.filter((marker) => {
        if (marker === selected) return false;
        const mx = Number.parseFloat(marker.style.left);
        const my = Number.parseFloat(marker.style.top);
        const r = marker.offsetWidth / 2 + gap;
        return mx + r > left && mx - r < left + width && my + r > top && my - r < top + height;
      }).length;
      return overflow * 1000 + covered * 10000;
    };
    const best = candidates.reduce((a, b) => score(a) <= score(b) ? a : b);
    const left = Math.max(margin, Math.min(scene.clientWidth - width - margin, best.left));
    const top = Math.max(margin, Math.min(scene.clientHeight - height - margin, best.top));
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function queuePosition(): void {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(position);
  }

  function updateContent(marker: HTMLElement): void {
    selected = marker;
    const country = marker.dataset.country || '';
    hero.dataset.selectedCountry = country;
    if (title) title.textContent = marker.getAttribute('aria-label') || '';
    // Counts are optional authorable data, never invented from the design.
    // The future CMS list can supply them without changing this component.
    const count = marker.getAttribute('data-credentials-count');
    if (summary) summary.textContent = count !== null && /^\d+$/.test(count)
      ? `${count} ${count === '1' ? 'credential' : 'credentials'}`
      : 'Selected credentials';
  }

  function updateControls(): void {
    for (const marker of markers) {
      const active = marker === requested;
      marker.setAttribute('role', mobile.matches ? 'tab' : 'button');
      marker.tabIndex = !mobile.matches || active ? 0 : -1;
      if (mobile.matches) {
        marker.setAttribute('aria-selected', String(active));
        marker.removeAttribute('aria-pressed');
        marker.removeAttribute('aria-expanded');
      } else {
        marker.setAttribute('aria-pressed', String(active));
        marker.setAttribute('aria-expanded', String(active));
        marker.removeAttribute('aria-selected');
      }
    }
    tablist?.setAttribute('role', mobile.matches ? 'tablist' : 'group');
    if (mobile.matches) {
      card?.setAttribute('role', 'tabpanel');
      if (requested) card?.setAttribute('aria-labelledby', requested.id);
    } else {
      card?.removeAttribute('role');
      card?.removeAttribute('aria-labelledby');
    }
    for (const shape of countryShapes) {
      shape.setAttribute('opacity', shape.dataset.credentialsRegion === requested?.dataset.country ? '1' : '0.7');
    }
  }

  async function loadCountryShapes(): Promise<void> {
    if (!image || !card) return;
    try {
      const response = await fetch(image.currentSrc || image.src);
      if (!response.ok) return;
      const parsed = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      const source = parsed.querySelector('svg');
      if (!source || parsed.querySelector('parsererror')) return;
      const svg = document.importNode(source, true) as SVGSVGElement;
      const shapes = Array.from(svg.querySelectorAll<SVGElement>('mask [data-credentials-region]'));
      if (shapes.length !== markers.length || markers.some((marker) =>
        !shapes.some((shape) => shape.dataset.credentialsRegion === marker.dataset.country))) return;

      // Each component instance needs its own mask IDs. The original image
      // remains as the fallback and geometry anchor while the SVG loads.
      const ids = new Map<string, string>();
      for (const element of Array.from(svg.querySelectorAll('[id]'))) {
        const original = element.id;
        element.id = `${original}-${card.id}`;
        ids.set(original, element.id);
      }
      for (const element of Array.from(svg.querySelectorAll('*'))) {
        for (const attribute of Array.from(element.attributes)) {
          if (!attribute.value.includes('url(#')) continue;
          element.setAttribute(attribute.name, attribute.value.replace(/url\(#([^)]+)\)/g,
            (match, id: string) => ids.has(id) ? `url(#${ids.get(id)})` : match));
        }
      }
      svg.setAttribute('class', `${image.className} credentials-map-vector`);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      countryShapes = shapes;
      updateControls();
      image.after(svg);
      image.dataset.vectorReady = 'true';
      camera?.setVector(svg);
      if (mobile.matches && requested) camera?.focus(requested, false);
    } catch {
      // Keep the authored SVG image, with its 70% / 20% idle fills, if the
      // enhancement cannot load. Marker placement never depends on this fetch.
    }
  }

  async function fade(visible: boolean, fromCurrent = true): Promise<boolean> {
    if (!card) return false;
    const current = getComputedStyle(card);
    const start = fromCurrent
      ? { opacity: current.opacity, transform: current.transform }
      : { opacity: '0', transform: 'translateY(6px)' };
    animation?.cancel();
    if (reducedMotion.matches) return true;
    animation = card.animate([
      start,
      { opacity: visible ? '1' : '0', transform: visible ? 'translateY(0)' : 'translateY(6px)' },
    ], { duration: visible ? 220 : 140, easing: 'cubic-bezier(0.2, 0.65, 0.3, 1)', fill: 'forwards' });
    try {
      await animation.finished;
      return true;
    } catch {
      // A newer selection takes over from the current visual state.
      return false;
    }
  }

  async function show(marker: HTMLElement | null): Promise<void> {
    if (!card || marker === requested || (mobile.matches && !marker)) return;
    const change = ++revision;
    requested = marker;
    updateControls();
    if (mobile.matches && marker) camera?.focus(marker);
    card.inert = true;
    if (card.dataset.state === 'open' && !await fade(false)) return;
    if (change !== revision) return;
    card.dataset.state = 'closed';
    card.setAttribute('aria-hidden', 'true');
    animation?.cancel();
    if (!marker) return;

    // Move and replace the content only while invisible. This prevents a
    // card sliding across the Atlantic or flashing the previous country.
    updateContent(marker);
    position();
    card.dataset.state = 'open';
    card.setAttribute('aria-hidden', 'false');
    card.inert = false;
    if (await fade(true, false) && change === revision) animation?.cancel();
  }

  function cancelClose(): void {
    window.clearTimeout(closeTimer);
  }

  function activate(marker: HTMLElement): void {
    cancelClose();
    if (suppressed !== marker) void show(marker);
  }

  function scheduleClose(): void {
    cancelClose();
    if (mobile.matches) return;
    closeTimer = window.setTimeout(() => {
      const focused = document.activeElement;
      const keyboardFocus = focused instanceof HTMLElement && focused.matches(':focus-visible')
        && (focused === requested || card?.contains(focused));
      if (hovered === requested || hoveringCard || keyboardFocus) return;
      void show(null);
    }, 140);
  }

  function dismiss(): void {
    if (mobile.matches) return;
    cancelClose();
    const focused = document.activeElement;
    suppressed = hovered === requested || card?.contains(focused)
      || (focused === requested && requested?.matches(':focus-visible')) ? requested : null;
    if (card?.contains(document.activeElement)) selected.focus({ preventScroll: true });
    void show(null);
  }

  for (const marker of markers) {
    let touchInput = false;
    marker.addEventListener('pointerdown', (event) => {
      touchInput = event.pointerType === 'touch';
    });
    marker.addEventListener('pointerenter', (event) => {
      if (mobile.matches || event.pointerType === 'touch') return;
      hovered = marker;
      activate(marker);
    });
    marker.addEventListener('pointerleave', (event) => {
      if (mobile.matches || event.pointerType === 'touch') return;
      if (hovered === marker) hovered = null;
      if (suppressed === marker) suppressed = null;
      scheduleClose();
    });
    marker.addEventListener('focus', () => {
      if (marker.matches(':focus-visible')) activate(marker);
    });
    marker.addEventListener('blur', scheduleClose);
    marker.addEventListener('click', (event) => {
      event.preventDefault();
      // Desktop clicks never pin a hover card. Touch has no hover, so a
      // tap provides the equivalent preview until another tap or dismissal.
      if (mobile.matches || touchInput) {
        suppressed = null;
        activate(marker);
      }
    });
    marker.addEventListener('keydown', (event) => {
      // Wrapped tabs have no fixed column count; navigate in reading order.
      if (mobile.matches && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const index = markers.indexOf(marker);
        const step = event.key === 'ArrowLeft' ? -1 : 1;
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? markers.length - 1
          : (index + step + markers.length) % markers.length;
        suppressed = null;
        activate(markers[next]);
        markers[next].focus({ preventScroll: true });
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        suppressed = null;
        cancelClose();
        void show(marker).then(() => {
          if (!mobile.matches && event.key === 'Enter' && requested === marker) card.querySelector<HTMLAnchorElement>('a')?.focus();
        });
      }
    });
  }

  card.addEventListener('pointerenter', (event) => {
    if (mobile.matches || event.pointerType === 'touch') return;
    hoveringCard = true;
    activate(selected);
  });
  card.addEventListener('pointerleave', (event) => {
    if (mobile.matches || event.pointerType === 'touch') return;
    hoveringCard = false;
    scheduleClose();
  });
  card.addEventListener('focusin', cancelClose);
  card.addEventListener('focusout', scheduleClose);

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (requested && target instanceof Node && !card.contains(target)
      && !markers.some((marker) => marker.contains(target))) dismiss();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && requested) dismiss();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      animation?.finish();
      if (mobile.matches && requested) camera?.focus(requested, false);
    }
  });

  for (const link of Array.from(hero.querySelectorAll<HTMLAnchorElement>('a[href="#credentials"]'))) {
    link.addEventListener('click', (event) => {
      const target = document.getElementById('credentials');
      // Keep the hero usable on pages that do not include the list.
      if (!target) {
        event.preventDefault();
        return;
      }
      const country = card?.contains(link) ? selected.dataset.country || 'all' : 'all';
      event.preventDefault();
      event.stopPropagation();
      target.dispatchEvent(new CustomEvent('credentials:filter', { detail: { country }, bubbles: true }));
      // The section edge should meet the viewport edge, without Webflow's
      // fixed-header anchor offset. Reuse the site's smooth-scroll instance.
      const focusSection = () => target.focus({ preventScroll: true });
      if (lenis && !reducedMotion.matches) {
        lenis.scrollTo(target, { offset: 0, onComplete: focusSection });
      } else {
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
        focusSection();
      }
      if (location.hash !== '#credentials') history.pushState(null, '', '#credentials');
    });
  }

  image.addEventListener('load', queuePosition);
  if (window.ResizeObserver) new ResizeObserver(queuePosition).observe(scene);
  function syncLayout(): void {
    if (!card) return;
    cancelClose();
    ++revision;
    animation?.cancel();
    requested = null;
    hovered = null;
    hoveringCard = false;
    suppressed = null;
    card.dataset.state = 'closed';
    card.setAttribute('aria-hidden', 'true');
    card.inert = true;
    camera?.reset();
    updateControls();
    if (mobile.matches) void show(selected);
    queuePosition();
  }
  mobile.addEventListener('change', syncLayout);
  window.addEventListener('resize', queuePosition);
  window.addEventListener('scroll', () => {
    if (requested) queuePosition();
  }, { passive: true });
  document.fonts?.ready.then(queuePosition);
  syncLayout();
  void loadCountryShapes();
}

export function initCredentialsMap(lenis?: Lenis): void {
  document.querySelectorAll<HTMLElement>('[data-credentials-hero]').forEach((hero) => setupHero(hero, lenis));
}
