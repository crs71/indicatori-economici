/**
 * scrolly.js
 * Controller minimalist de Scrollytelling bazat pe IntersectionObserver nativ.
 * Detectează pasul narativ activ și declanșează actualizarea panoului vizual fix.
 */

export function initScrollytelling({ stepSelector, onStepChange }) {
  const steps = document.querySelectorAll(stepSelector);
  if (!steps.length) return;

  let currentActiveStep = null;

  // Pe mobil panoul fix ocupă cam 40% din partea de sus a ecranului, așa că
  // pasul activ se alege dintr-o bandă aflată sub el, nu din spatele lui.
  const isStacked = window.matchMedia('(max-width: 1100px)').matches;

  const observerOptions = {
    root: null,
    rootMargin: isStacked ? '-50% 0px -25% 0px' : '-30% 0px -45% 0px',
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const stepElement = entry.target;
        const stepId = stepElement.getAttribute('data-step');

        if (stepId && stepId !== currentActiveStep) {
          currentActiveStep = stepId;

          steps.forEach((s) => s.classList.remove('is-active'));
          stepElement.classList.add('is-active');

          if (typeof onStepChange === 'function') {
            onStepChange(stepId, stepElement);
          }
        }
      }
    });
  }, observerOptions);

  steps.forEach((step) => observer.observe(step));

  if (steps[0]) {
    steps[0].classList.add('is-active');
    const initialId = steps[0].getAttribute('data-step');
    if (initialId && typeof onStepChange === 'function') {
      onStepChange(initialId, steps[0]);
    }
  }

  return {
    destroy() {
      steps.forEach((step) => observer.unobserve(step));
    },
  };
}
