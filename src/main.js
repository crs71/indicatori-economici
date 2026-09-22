/**
 * main.js – coordonare BNR, scrollytelling, calculator, animații
 */
import { getExchangeRateData } from './bnr-service.js';
import { generateStudentTranslations, calculateCustomImpact, formatRon, CURRENCY_CONFIG } from './translations.js';
import { initScrollytelling } from './scrolly.js';

let exchangeData = null;
let translationsData = null;
let activeCurrency = 'EUR';
let currentStepId = 'step-intro';
let hasDrawnSparkline = false;

function animateNumber(element, targetNum, formatFn, duration = 450) {
  if (!element) return;
  const start = performance.now();
  const from = parseFloat(String(element.textContent).replace(/[^0-9.,\-]/g, '').replace(',', '.')) || 0;
  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = from + (targetNum - from) * ease;
    element.textContent = formatFn(val);
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function flashClass(el, className, ms = 500) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  window.setTimeout(() => el.classList.remove(className), ms);
}

function syncChartDetailsOpen() {
  const details = document.getElementById('chartDetails');
  if (!details) return;
  if (window.matchMedia('(min-width: 1101px)').matches) {
    details.open = true;
  } else if (!details.dataset.userToggled) {
    details.open = false;
  }
}

function initChartDetails() {
  const details = document.getElementById('chartDetails');
  if (!details) return;
  details.addEventListener('toggle', () => {
    details.dataset.userToggled = '1';
    if (details.open) {
      triggerSparklineAnimation();
      const area = document.getElementById('sparklineArea');
      if (area) {
        area.classList.remove('is-visible');
        void area.offsetWidth;
        area.classList.add('is-visible');
      }
    }
  });
  syncChartDetailsOpen();
  window.addEventListener('resize', syncChartDetailsOpen);
}

function initScrollProgress() {
  const bar = document.getElementById('scrollProgressBar');
  if (!bar) return;
  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${docHeight > 0 ? (scrollTop / docHeight) * 100 : 0}%`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initStepProgress() {
  const steps = document.querySelectorAll('.step');
  const sticky = document.getElementById('stickyDisplay');
  if (!steps.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const ratio = entry.intersectionRatio;
        if (sticky) sticky.style.setProperty('--step-progress', ratio.toFixed(3));
        entry.target.style.setProperty('--in-view', ratio.toFixed(3));
      });
    },
    { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1], rootMargin: '-20% 0px -20% 0px' }
  );
  steps.forEach((s) => observer.observe(s));
}

function renderSparkline(history) {
  const svg = document.getElementById('sparklineSvg');
  const path = document.getElementById('sparklinePath');
  const area = document.getElementById('sparklineArea');
  const pointsGroup = document.getElementById('sparklinePoints');
  if (!svg || !path || !history?.length) return;
  const w = 340, h = 90, pad = 14;
  const rates = history.map((p) => p.rate);
  const min = Math.min(...rates), max = Math.max(...rates);
  const span = max - min || 0.01;
  const coords = history.map((p, i) => {
    const x = pad + (i / (history.length - 1 || 1)) * (w - pad * 2);
    const y = pad + (1 - (p.rate - min) / span) * (h - pad * 2);
    return { x, y, p };
  });
  const d = coords.map((c, i) => `${i ? 'L' : 'M'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  path.setAttribute('d', d);
  if (area) {
    const last = coords[coords.length - 1], first = coords[0];
    area.setAttribute('d', `${d} L ${last.x.toFixed(1)} ${h} L ${first.x.toFixed(1)} ${h} Z`);
    area.classList.remove('is-visible');
    void area.offsetWidth;
    area.classList.add('is-visible');
  }
  if (pointsGroup) {
    pointsGroup.innerHTML = '';
    coords.forEach((c, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', c.x.toFixed(1));
      circle.setAttribute('cy', c.y.toFixed(1));
      circle.setAttribute('class', `sparkline-point ${i === coords.length - 1 ? 'is-highlighted' : ''}`);
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${c.p.labelRo || c.p.date}: ${c.p.rate.toFixed(4)} lei`;
      circle.appendChild(title);
      pointsGroup.appendChild(circle);
    });
  }
  const rangeText = `min: ${min.toFixed(4)} • max: ${max.toFixed(4)}`;
  const rangeLabel = document.getElementById('chartRangeLabel');
  const rangeSummary = document.getElementById('chartRangeLabelSummary');
  if (rangeLabel) rangeLabel.textContent = rangeText;
  if (rangeSummary) rangeSummary.textContent = rangeText;
}

function triggerSparklineAnimation() {
  const path = document.getElementById('sparklinePath');
  if (!path) return;
  path.classList.remove('animate-draw');
  void path.offsetWidth;
  path.classList.add('animate-draw');
}

function updateTimelineDots(stepId) {
  document.querySelectorAll('.step-dot').forEach((dot) => {
    dot.classList.toggle('is-active', dot.getAttribute('data-dot') === stepId);
  });
}

function updateComparisonVisual(baseVal, diffVal, isUp) {
  const compBarBase = document.getElementById('compBarBase');
  const compBarDiff = document.getElementById('compBarDiff');
  const legBase = document.getElementById('legBase');
  const legDiff = document.getElementById('legDiff');
  const compContainer = document.getElementById('lensComparison');
  if (!compBarBase || !compBarDiff) return;
  if (Math.abs(diffVal) < 0.0001) {
    if (compContainer) compContainer.style.opacity = '0.4';
    return;
  }
  if (compContainer) compContainer.style.opacity = '1';
  const absDiff = Math.abs(diffVal);
  const total = baseVal + absDiff;
  const visualDiffPct = Math.max(4, Math.min(22, (absDiff / total) * 100 * 4));
  compBarBase.style.width = `${100 - visualDiffPct}%`;
  compBarDiff.style.width = `${visualDiffPct}%`;
  compBarDiff.classList.toggle('down', !isUp);
  if (legBase) legBase.textContent = `Cost start: ${formatRon(baseVal)}`;
  if (legDiff) legDiff.textContent = `${formatRon(diffVal, true)} variație`;
}

function handleStepChange(stepId) {
  currentStepId = stepId;
  if (!exchangeData || !translationsData) return;
  const currData = exchangeData.currencies[activeCurrency];
  const { scenarios, meta } = translationsData;
  const lensLabel = document.getElementById('lensLabel');
  const lensValue = document.getElementById('lensValue');
  const lensDetail = document.getElementById('lensDetail');
  const sticky = document.getElementById('stickyDisplay');
  const lens = document.getElementById('dynamicLens');

  updateTimelineDots(stepId);
  flashClass(sticky, 'is-updating', 550);
  flashClass(lens, 'is-updating', 500);

  switch (stepId) {
    case 'step-intro':
      lensLabel.textContent = `Perspectivă: 1 ${activeCurrency}`;
      lensValue.textContent = `1 ${activeCurrency} = ${currData.currentRate.toFixed(4)} lei`;
      lensDetail.textContent = `Fixing BNR • ${exchangeData.currentDateFormatted}.`;
      updateComparisonVisual(0, 0, meta.isUp);
      break;
    case 'step-variation':
      lensLabel.textContent = `Interval 10 zile (${activeCurrency})`;
      lensValue.textContent = `${meta.deltaFormatted} (${meta.percentFormatted})`;
      lensDetail.textContent = `De la ${currData.startRate.toFixed(4)} la cursul de azi.`;
      updateComparisonVisual(currData.startRate, currData.delta10Days, meta.isUp);
      if (!hasDrawnSparkline) { triggerSparklineAnimation(); hasDrawnSparkline = true; }
      break;
    case 'step-sub':
      lensLabel.textContent = `${scenarios[0].title}`;
      animateNumber(lensValue, scenarios[0].amount * currData.currentRate, (v) => `${formatRon(v)} / lună`);
      lensDetail.textContent = `Diferență: ${scenarios[0].diffMonthly}/lună (${scenarios[0].diffAcademicYear}/an univ.).`;
      updateComparisonVisual(scenarios[0].amount * currData.startRate, scenarios[0].amount * currData.delta10Days, meta.isUp);
      break;
    case 'step-books':
      lensLabel.textContent = `${scenarios[1].title}`;
      animateNumber(lensValue, scenarios[1].amount * currData.currentRate, (v) => formatRon(v));
      lensDetail.textContent = `Diferență 10 zile: ${scenarios[1].diffFormatted}.`;
      updateComparisonVisual(scenarios[1].amount * currData.startRate, scenarios[1].amount * currData.delta10Days, meta.isUp);
      break;
    case 'step-rent':
      lensLabel.textContent = `${scenarios[2].title}`;
      animateNumber(lensValue, scenarios[2].amount * currData.currentRate, (v) => `${formatRon(v)} / lună`);
      lensDetail.textContent = `Diferență lunară: ${scenarios[2].diffFormatted}.`;
      updateComparisonVisual(scenarios[2].amount * currData.startRate, scenarios[2].amount * currData.delta10Days, meta.isUp);
      break;
    case 'step-threshold': {
      const at200 = 200 * Math.abs(currData.delta10Days);
      lensLabel.textContent = 'Pragul de relevanță';
      lensValue.textContent = at200 < 2 ? 'Sub ~2 lei la 200 unități' : `${formatRon(at200)} la 200 unități`;
      lensDetail.textContent = 'Sub ~50/lună: zgomot. Peste ~200–300: verifică înainte de transfer mare.';
      updateComparisonVisual(200 * currData.startRate, 200 * currData.delta10Days, meta.isUp);
      break;
    }
    case 'step-compare':
      lensLabel.textContent = `Compară valute (${activeCurrency})`;
      lensValue.textContent = `1 ${activeCurrency} = ${currData.currentRate.toFixed(4)} lei`;
      lensDetail.textContent = 'Comută EUR / USD / GBP — scenariile se rescriu automat.';
      updateComparisonVisual(currData.startRate, currData.delta10Days, meta.isUp);
      break;
    default:
      break;
  }
}

function updateStoryTexts(currData, tr) {
  const { scenarios, meta } = tr;
  const s2 = document.getElementById('step2Title');
  const b2 = document.getElementById('step2Body');
  const i2 = document.getElementById('step2Insight');
  if (s2) s2.textContent = meta.isNeutral
    ? `Stagnare pe 10 zile (${activeCurrency})`
    : `O ${meta.directionText} de ${meta.percentFormatted} în 10 zile`;
  if (b2) b2.innerHTML = `De la <strong>${currData.startRate.toFixed(4)} lei</strong> la <strong>${currData.currentRate.toFixed(4)} lei</strong> (${meta.deltaFormatted}).`;
  if (i2) i2.innerHTML = `<strong>Ce înseamnă:</strong> Variație pe 10 ședințe bancare BNR pentru ${activeCurrency}.`;

  const titles = ['step3Title', 'step4Title', 'step5Title'];
  const bodies = ['step3Body', 'step4Body', 'step5Body'];
  const insights = ['step3Insight', 'step4Insight', 'step5Insight'];
  scenarios.forEach((sc, idx) => {
    const t = document.getElementById(titles[idx]);
    const b = document.getElementById(bodies[idx]);
    const ins = document.getElementById(insights[idx]);
    if (t) t.textContent = `${sc.title} (${sc.amountFormatted})`;
    if (b) b.innerHTML = `Cost start <strong>${sc.costStart}</strong> → azi <strong>${sc.costNow}</strong>.`;
    if (ins) ins.innerHTML = `<strong>Impact:</strong> ${sc.diffFormatted}. ${sc.takeaway}`;
  });
}

function setCurrency(newCurrency) {
  if (!exchangeData?.currencies[newCurrency]) return;
  activeCurrency = newCurrency;
  document.querySelectorAll('.curr-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-curr') === activeCurrency);
  });
  const currData = exchangeData.currencies[activeCurrency];
  translationsData = generateStudentTranslations(activeCurrency, currData, exchangeData);
  const pairLabel = document.getElementById('currencyPairLabel');
  if (pairLabel) pairLabel.textContent = CURRENCY_CONFIG[activeCurrency].pairLabel;
  const displayRate = document.getElementById('displayRate');
  if (displayRate) {
    animateNumber(displayRate, currData.currentRate, (v) => v.toFixed(4));
    flashClass(displayRate, 'is-popping', 450);
  }
  const badge = document.getElementById('displayDeltaBadge');
  if (badge) {
    const isUp = currData.delta10Days > 0;
    const isNeutral = Math.abs(currData.delta10Days) < 0.0001;
    badge.className = `rate-delta-badge ${isUp ? 'up' : isNeutral ? 'neutral' : 'down'}`;
    const sign = isUp ? '+' : '';
    badge.innerHTML = `<span>${sign}${currData.delta10Days.toFixed(4)} lei (${sign}${currData.percentChange10Days.toFixed(2)}%) în 10 zile</span>`;
    flashClass(badge, 'is-popping', 400);
  }
  renderSparkline(currData.history);
  triggerSparklineAnimation();
  updateStoryTexts(currData, translationsData);
  handleStepChange(currentStepId);
  updateCalculatorCurrency(activeCurrency);
}

function initCurrencySwitcher() {
  document.querySelectorAll('.curr-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-curr');
      if (selected && selected !== activeCurrency) setCurrency(selected);
    });
  });
}

function initTimelineNavigation() {
  document.querySelectorAll('.step-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const id = dot.getAttribute('data-dot');
      const el = document.querySelector(`[data-step="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

let triggerCalcUpdate = () => {};

function updateCalculatorCurrency(currCode) {
  const cfg = CURRENCY_CONFIG[currCode] || CURRENCY_CONFIG.EUR;
  const symbolEl = document.getElementById('calcCurrencySymbol');
  const chips = document.getElementById('calcPresetChips');
  const input = document.getElementById('calcInput');
  if (symbolEl) symbolEl.textContent = cfg.symbol;
  if (chips) {
    chips.innerHTML = '';
    cfg.presets.forEach((val) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip-btn';
      b.textContent = `${val} ${cfg.symbol}`;
      b.addEventListener('click', () => {
        input.value = val;
        document.getElementById('calcSlider').value = Math.min(val, 1000);
        triggerCalcUpdate(true);
      });
      chips.appendChild(b);
    });
  }
  if (input) {
    input.value = cfg.defaultAmount;
    document.getElementById('calcSlider').value = cfg.defaultAmount;
  }
  triggerCalcUpdate(true);
}

function initCalculator() {
  const input = document.getElementById('calcInput');
  const slider = document.getElementById('calcSlider');
  const resStart = document.getElementById('resStartCost');
  const resCurrent = document.getElementById('resCurrentCost');
  const resDiff = document.getElementById('resDiffCost');
  function update(animate = false) {
    if (!exchangeData) return;
    const currData = exchangeData.currencies[activeCurrency];
    const val = parseFloat(input.value) || 0;
    const impact = calculateCustomImpact(val, activeCurrency, currData);
    if (animate) {
      animateNumber(resStart, val * currData.startRate, (v) => formatRon(v), 300);
      animateNumber(resCurrent, val * currData.currentRate, (v) => formatRon(v), 300);
      animateNumber(resDiff, val * currData.delta10Days, (v) => formatRon(v, true), 300);
    } else {
      resStart.textContent = impact.costStart;
      resCurrent.textContent = impact.costNow;
      resDiff.textContent = impact.diffFormatted;
    }
    resDiff.style.color = impact.isPositive
      ? 'var(--diff-up-color)'
      : impact.isZero
        ? 'var(--diff-neutral-color)'
        : 'var(--diff-down-color)';
  }
  triggerCalcUpdate = update;
  input.addEventListener('input', () => { slider.value = input.value; update(false); });
  slider.addEventListener('input', () => { input.value = slider.value; update(false); });
  update(false);
}

async function initApp() {
  const statusText = document.getElementById('dataStatusText');
  const displayDate = document.getElementById('displayDate');
  initScrollProgress();
  initStepProgress();
  initTimelineNavigation();
  initCurrencySwitcher();
  initCalculator();
  initChartDetails();
  try {
    exchangeData = await getExchangeRateData();
    if (statusText) {
      statusText.textContent = exchangeData.isFallback
        ? 'Date oficiale recente (mod offline)'
        : `Flux BNR conectat • ${exchangeData.currentDateFormatted}`;
    }
    if (displayDate) displayDate.textContent = exchangeData.currentDateFormatted;
    initScrollytelling({ stepSelector: '.step', onStepChange: handleStepChange });
    setCurrency('EUR');
  } catch (error) {
    console.error(error);
    if (statusText) statusText.textContent = 'Eroare la încărcarea datelor';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
