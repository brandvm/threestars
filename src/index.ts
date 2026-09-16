import { initAnchorScroll } from "./modules/anchor-scroll";
import { initBioModal } from "./modules/bio-modal";
import { initClock } from "./modules/clock";
import { initContactForm } from "./modules/contact-form";
import { initHomePreloader } from "./modules/home-preloader";
import { initInterviews } from "./modules/interviews";
import { initNavigation } from "./modules/navigation";
import { initCredentialsMap } from "./modules/credentials-map";
import { initCredentialsList } from "./modules/credentials-list";
import { initLists } from "./modules/finsweet-list";
import { initParallax } from "./modules/parallax";
import { initPressList } from "./modules/press-list";
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
initPressList();
// After the page modules, which set attributes List must see at init.
initLists();
initParallax(lenis);
initBioModal(lenis);
initNavigation(lenis);
// After navigation, whose link listeners release the mobile menu's scroll
// lock before an in-page jump. Before the preloader, so an arrival hash
// waits for the lock to lift rather than finding it already gone.
initAnchorScroll(lenis);

// The homepage intro owns the lock until its reveal; other pages release now.
initHomePreloader(lenis);
