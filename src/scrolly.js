/**
 * Scrollytelling controller based on IntersectionObserver.
 * Marks narrative steps as active while scrolling; drives the sticky visual panel.
 */

const DEFAULT_OPTS = {
  root: null,
  rootMargin: '-20% 0px -40% 0px',
  threshold: 0,
};

/**
 * @param {string} stepSelector - CSS selector for narrative steps
 * @param {(el: Element, index: number) => void} onStep - callback when a step becomes active
 * @param {IntersectionObserverInit} [opts]
 * @returns {{ destroy: () => void }}
 */
export function initScrolly(stepSelector, onStep, opts = {}) {
  const steps = Array.from(document.querySelectorAll(stepSelector));
  if (!steps.length) {
    console.warn('[scrolly] no steps found for', stepSelector);
    return { destroy() {} };
  }

  let activeIndex = -1;

  const observer = new IntersectionObserver((entries) => {
    // Prefer the entry with largest intersection ratio among those intersecting
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (!visible.length) return;

    const top = visible[0].target;
    const idx = steps.indexOf(top);
    if (idx === -1 || idx === activeIndex) return;

    activeIndex = idx;
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    onStep(top, idx);
  }, { ...DEFAULT_OPTS, ...opts });

  steps.forEach((s) => observer.observe(s));

  // Kick first step if already in view on load
  requestAnimationFrame(() => {
    const first = steps[0];
    if (first && activeIndex === -1) {
      activeIndex = 0;
      first.classList.add('is-active');
      onStep(first, 0);
    }
  });

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
