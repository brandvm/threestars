import { initClock } from './modules/clock';
import { initSmoothScroll } from './modules/smooth-scroll';

initSmoothScroll();
initClock();

// Release the pre-paint scroll lock set by the head bootstrap.
document.documentElement.classList.remove('is-loading');
