/**
 * Acțiune Svelte: adaugă clasa `is-revealed` unui element o singură dată, când
 * intră prima oară în ecran — pentru un fade+slide-in simplu la scroll.
 * Spre deosebire de scrollStep.js (curs), aici nu urmărim "care e activ", doar
 * "a apărut", deci un singur IntersectionObserver de unică folosință e suficient.
 */
export function scrollReveal(node, { delay = 0 } = {}) {
  if (delay) node.style.transitionDelay = `${delay}ms`;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          node.classList.add('is-revealed');
          observer.unobserve(node);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );
  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
