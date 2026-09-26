/**
 * Acțiune Svelte care înlocuiește scrolly.js: observă un element `.step`
 * și cheamă `onActive(stepId)` când devine pasul activ al narațiunii.
 */
const isStacked = () => window.matchMedia('(max-width: 1100px)').matches;

export function scrollStep(node, { stepId, onActive }) {
  const rootMargin = isStacked() ? '-50% 0px -25% 0px' : '-30% 0px -45% 0px';

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) onActive(stepId);
      });
    },
    { root: null, rootMargin, threshold: 0 }
  );
  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
