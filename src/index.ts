import { initBioModal } from './modules/bio-modal';
import { initClock } from './modules/clock';
import { initParallax } from './modules/parallax';
import { initRegionMap } from './modules/region-map';
import { initSmoothScroll } from './modules/smooth-scroll';
import { initYear } from './modules/year';

// Parallax rides Lenis's scroll callback, so it needs the instance. It is
// undefined under prefers-reduced-motion, which is also the signal to skip.
const lenis = initSmoothScroll();

initClock();
initYear();
initRegionMap();
initParallax(lenis);
initBioModal(lenis);

// Release the pre-paint scroll lock set by the head bootstrap.
document.documentElement.classList.remove('is-loading');
