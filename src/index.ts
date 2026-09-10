import { initBioModal } from "./modules/bio-modal";
import { initClock } from "./modules/clock";
import { initContactForm } from "./modules/contact-form";
import { initHomePreloader } from "./modules/home-preloader";
import { initInterviews } from "./modules/interviews";
import { initNavigation } from "./modules/navigation";
import { initCredentialsMap } from "./modules/credentials-map";
import { initCredentialsList } from "./modules/credentials-list";
import { initParallax } from "./modules/parallax";
import { initRegionMap } from "./modules/region-map";
import { initSmoothScroll } from "./modules/smooth-scroll";
import { initYear } from "./modules/year";

// Parallax rides Lenis's scroll callback, so it needs the instance. It is
// undefined under prefers-reduced-motion, which is also the signal to skip.
const lenis = initSmoothScroll();

initClock();
initYear();
initContactForm();
initInterviews();
initRegionMap();
initCredentialsMap(lenis);
initCredentialsList();
initParallax(lenis);
initBioModal(lenis);
initNavigation(lenis);

// The homepage intro owns the lock until its reveal; other pages release now.
initHomePreloader(lenis);
