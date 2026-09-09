/** Phone-only country camera. Composite during flight, then use the SVG
 * viewBox at rest so the enlarged map remains sharp on high-density phones. */
type Frame = { x: number; y: number; width: number };
const MAP_WIDTH = 2039;
const MAP_HEIGHT = 1344;

export function createCredentialsCamera(viewport: HTMLElement, image: HTMLImageElement,
  reducedMotion: MediaQueryList) {
  let vector: SVGSVGElement | null = null;
  let current: Frame | null = null;
  let flight: Animation | null = null;
  let sample: ((progress: number) => Frame) | null = null;
  let duration = 0;
  let size = '';
  let enabled = false;

  function bounded(frame: Frame): Frame {
    const aspect = viewport.clientWidth / viewport.clientHeight;
    const width = Math.min(frame.width, MAP_WIDTH, MAP_HEIGHT * aspect);
    const height = width / aspect;
    return { width, x: Math.max(width / 2, Math.min(MAP_WIDTH - width / 2, frame.x)),
      y: Math.max(height / 2, Math.min(MAP_HEIGHT - height / 2, frame.y)) };
  }

  function transform(frame: Frame): string {
    const scale = viewport.clientWidth / frame.width;
    return `translate(${viewport.clientWidth / 2 - frame.x * scale}px, ${viewport.clientHeight / 2 - frame.y * scale}px) scale(${scale})`;
  }

  function fullMap(layer: HTMLElement | SVGSVGElement): void {
    layer.style.width = `${MAP_WIDTH}px`;
    layer.style.height = `${MAP_HEIGHT}px`;
    layer.style.left = '0px';
    layer.style.top = '0px';
    layer.style.transformOrigin = '0 0';
    if (layer === vector) vector.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
  }

  function stop(): void {
    if (flight && sample) current = sample(Math.min(1, Number(flight.currentTime || 0) / duration));
    flight?.cancel();
    flight = null;
    sample = null;
  }

  function rest(frame: Frame): void {
    current = bounded(frame);
    fullMap(image);
    image.style.transform = transform(current);
    if (vector) {
      const height = current.width * viewport.clientHeight / viewport.clientWidth;
      vector.style.width = '100%';
      vector.style.height = '100%';
      vector.style.left = '0px';
      vector.style.top = '0px';
      vector.style.transform = 'none';
      vector.style.willChange = 'auto';
      vector.setAttribute('viewBox', `${current.x - current.width / 2} ${current.y - height / 2} ${current.width} ${height}`);
    }
    viewport.dataset.cameraState = 'idle';
    viewport.dataset.credentialsCameraReady = 'true';
  }

  function focus(marker: HTMLElement, animate = true): void {
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    enabled = true;
    const nextSize = `${viewport.clientWidth}:${viewport.clientHeight}`;
    const resized = size !== nextSize;
    size = nextSize;
    const authoredWidth = Number(marker.dataset.mapCameraWidth);
    const target = bounded({ x: Number(marker.dataset.mapX), y: Number(marker.dataset.mapY),
      width: authoredWidth > 0 ? authoredWidth : marker.dataset.country === 'usa' ? 650 : 220 });
    if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) return;
    stop();
    if (!current || !animate || resized || reducedMotion.matches) {
      rest(target);
      return;
    }
    const start = current;
    const distance = Math.hypot(target.x - start.x, target.y - start.y);
    if (distance < 0.1 && Math.abs(target.width - start.width) < 0.1) return rest(target);
    // Pull back more for a transatlantic journey and less between neighbours.
    const pullback = Math.min(750, distance * 0.65);
    const frameAt = (progress: number): Frame => {
      const t = Math.max(0, Math.min(1, progress));
      const eased = t * t * (3 - 2 * t);
      return bounded({ x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        width: Math.exp(Math.log(start.width) * (1 - eased) + Math.log(target.width) * eased)
          + Math.sin(Math.PI * eased) * pullback });
    };
    const layer = vector || image;
    fullMap(layer);
    layer.style.willChange = 'transform';
    duration = distance > 300 ? 1200 : 800;
    sample = frameAt;
    viewport.dataset.cameraState = 'flying';
    flight = layer.animate(Array.from({ length: 61 }, (_, i) => ({ transform: transform(frameAt(i / 60)) })),
      { duration, easing: 'linear', fill: 'forwards' });
    const activeFlight = flight;
    flight.onfinish = () => {
      if (flight !== activeFlight) return;
      rest(target);
      activeFlight.cancel();
      flight = null;
      sample = null;
    };
  }

  function reset(): void {
    stop();
    enabled = false;
    current = null;
    size = '';
    for (const layer of [image, vector]) {
      if (!layer) continue;
      for (const property of ['width', 'height', 'left', 'top', 'transform', 'transform-origin', 'will-change']) {
        layer.style.removeProperty(property);
      }
    }
    vector?.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
    delete viewport.dataset.credentialsCameraReady;
    delete viewport.dataset.cameraState;
  }

  return { focus, reset, sync(marker: HTMLElement): void {
    if (size !== `${viewport.clientWidth}:${viewport.clientHeight}`) focus(marker, false);
  }, setVector(svg: SVGSVGElement): void {
    stop();
    vector = svg;
    if (enabled && current) rest(current);
  } };
}
