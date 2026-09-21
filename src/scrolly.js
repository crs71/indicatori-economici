/**
 * scrolly.js
 * Controller minimalist de Scrollytelling bazat pe IntersectionObserver nativ.
 * Detectează pasul narativ activ și declanșează actualizarea panoului vizual fix.
 */

export function initScrollytelling({ stepSelector, onStepChange }) {
  const steps = document.querySelectorAll(stepSelector);
  if (!steps.length) return;

  let currentActiveStep = null;

  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -45% 0px',
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
