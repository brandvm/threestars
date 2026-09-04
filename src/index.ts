import { initClock } from './modules/clock';
import { initRegionMap } from './modules/region-map';
import { initSmoothScroll } from './modules/smooth-scroll';
import { initYear } from './modules/year';

initSmoothScroll();
initClock();
initYear();
initRegionMap();

// Release the pre-paint scroll lock set by the head bootstrap.
document.documentElement.classList.remove('is-loading');
