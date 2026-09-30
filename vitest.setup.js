import '@testing-library/jest-dom/vitest';

// jsdom nu implementează matchMedia; svelte/motion îl folosește intern
// (pentru prefers-reduced-motion), iar StickyPanel îl folosește direct
// pentru breakpoint-ul desktop/mobil al graficului pliabil.
// jsdom nu implementează IntersectionObserver; folosit de acțiunea
// scrollReveal pentru animația de apariție la scroll a secțiunilor.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
