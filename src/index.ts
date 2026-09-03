import { initClock } from './modules/clock';
import { initSmoothScroll } from './modules/smooth-scroll';
import { initYear } from './modules/year';

initSmoothScroll();
initClock();
initYear();

// Release the pre-paint scroll lock set by the head bootstrap.
document.documentElement.classList.remove('is-loading');
