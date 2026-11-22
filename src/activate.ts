import './i18n';
import { carriers, isCarrierId, TOTAL_WIRELESS } from './carriers';
import { formatDisplayPhone, parseSafeAppleActivationUrl } from './lpa-utils';

const params = new URLSearchParams(window.location.search);
const carrierParam = params.get('carrier');
const carrierId = carrierParam === null ? TOTAL_WIRELESS : isCarrierId(carrierParam) ? carrierParam : null;
const carrier = carrierId === null ? null : carriers[carrierId];

document.body.dataset.carrier = carrierId ?? 'unknown';

if (carrier) {
  const brand = document.querySelector<HTMLAnchorElement>('#carrier-brand');
  const logo = brand?.querySelector('img');
  const help = document.querySelector<HTMLAnchorElement>('#carrier-help');

  document.title = `eSIM activation | ${carrier.name}`;
  if (brand && logo) {
    logo.src = carrier.logo;
    logo.alt = carrier.name;
    brand.href = carrier.help;
    brand.hidden = false;
  }
  if (help) {
    help.href = carrier.help;
    help.hidden = false;
  }

  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = carrier.logo;
  document.head.append(favicon);
}

if (carrierId === TOTAL_WIRELESS) {
  const template = document.querySelector<HTMLTemplateElement>('#total-store-template');
  template?.replaceWith(template.content.cloneNode(true));

  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = '/activate-manifest.webmanifest';
  document.head.append(manifest);
}

const esimShell = document.getElementById('esim-shell');
const activateBtn = document.getElementById('activate-btn') as HTMLAnchorElement | null;
const errorBox = document.getElementById('redirect-error');
const phoneBox = document.getElementById('redirect-phone-box');
const phoneNumberEl = document.getElementById('redirect-phone-number');
const copyPhoneBtn = document.getElementById('copy-phone-btn') as HTMLButtonElement | null;
const phoneStatusEl = document.getElementById('redirect-phone-status');
const wechatBanner = document.getElementById('wechat-safari-banner');
const motionToggleBtn = document.getElementById('guide-motion-toggle') as HTMLButtonElement | null;
const stepButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-step-target]')];
const stepDetails = [...document.querySelectorAll<HTMLElement>('[data-preview-step]')];

if (wechatBanner && /MicroMessenger/i.test(navigator.userAgent)) {
  wechatBanner.hidden = false;
}

activateBtn?.addEventListener('click', (event) => {
  if (activateBtn.getAttribute('aria-disabled') === 'true') {
    event.preventDefault();
  }
});

// iPhone setup walkthrough
type StepNum = 1 | 2 | 3 | 4;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let currentStep: StepNum = 1;
let stepTimer = 0;

function setStep(next: StepNum, focusBtn = false) {
  currentStep = next;
  esimShell?.setAttribute('data-step', String(next));

  for (const detail of stepDetails) {
    detail.hidden = Number(detail.dataset.previewStep) !== next;
  }

  for (const btn of stepButtons) {
    const target = Number(btn.dataset.stepTarget);
    const active = target === next;
    btn.setAttribute('aria-pressed', String(active));
    if (active && focusBtn) {
      btn.focus();
    }
  }
}

function stopAutoAdvance() {
  if (stepTimer) {
    clearInterval(stepTimer);
    stepTimer = 0;
  }
}

function startAutoAdvance() {
  stopAutoAdvance();
  if (reducedMotion.matches || esimShell?.hasAttribute('data-paused')) return;
  stepTimer = window.setInterval(() => {
    if (document.hidden || reducedMotion.matches || esimShell?.hasAttribute('data-paused')) return;
    const nextStep = ((currentStep % 4) + 1) as StepNum;
    setStep(nextStep);
  }, 3400);
}

for (const btn of stepButtons) {
  btn.addEventListener('click', () => {
    const target = Number(btn.dataset.stepTarget);
    if (target >= 1 && target <= 4) {
      setStep(target as StepNum);
      startAutoAdvance();
    }
  });

  btn.addEventListener('keydown', (event) => {
    let target: StepNum | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      target = ((currentStep % 4) + 1) as StepNum;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      target = (((currentStep + 2) % 4) + 1) as StepNum;
    } else if (event.key === 'Home') {
      target = 1;
    } else if (event.key === 'End') {
      target = 4;
    }
    if (target) {
      event.preventDefault();
      setStep(target, true);
      startAutoAdvance();
    }
  });
}

motionToggleBtn?.addEventListener('click', () => {
  if (!esimShell) return;
  const paused = esimShell.hasAttribute('data-paused');
  if (paused) {
    esimShell.removeAttribute('data-paused');
    startAutoAdvance();
  } else {
    esimShell.setAttribute('data-paused', '');
    stopAutoAdvance();
  }
});

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    stopAutoAdvance();
  } else {
    startAutoAdvance();
  }
});

setStep(1);
startAutoAdvance();

// URL params, phone number copy, and pure client-side LPA link resolution
const rawCandidate = params.get('url') || params.get('lpa') || params.get('carddata');
const assignedNumber = carrierId === TOTAL_WIRELESS ? formatDisplayPhone(params.get('phone') ?? '') : '';

let copyPhoneTimer = 0;
let lastPhoneAnnouncement = '';

copyPhoneBtn?.addEventListener('click', async () => {
  if (!assignedNumber) return;
  try {
    await navigator.clipboard.writeText(assignedNumber);
    clearTimeout(copyPhoneTimer);
    copyPhoneBtn.setAttribute('data-copied', '');
    if (phoneStatusEl) {
      const msg = 'Phone number copied.';
      const announced = msg === lastPhoneAnnouncement ? `${msg}\u00A0` : msg;
      lastPhoneAnnouncement = msg;
      phoneStatusEl.textContent = '';
      requestAnimationFrame(() => {
        phoneStatusEl.textContent = announced;
      });
    }
    copyPhoneTimer = window.setTimeout(() => {
      copyPhoneBtn.removeAttribute('data-copied');
      if (phoneStatusEl) phoneStatusEl.textContent = '';
    }, 1800);
  } catch {
    copyPhoneBtn.removeAttribute('data-copied');
  }
});

const parsed = carrier && parseSafeAppleActivationUrl(rawCandidate);
if (parsed) {
  if (activateBtn) {
    activateBtn.href = parsed.appleUrl;
    activateBtn.removeAttribute('aria-disabled');
  }
  if (assignedNumber && phoneBox && phoneNumberEl) {
    phoneNumberEl.textContent = assignedNumber;
    phoneBox.hidden = false;
  }
  if (errorBox) errorBox.hidden = true;
  esimShell?.setAttribute('data-state', 'ready');
} else {
  if (activateBtn) {
    activateBtn.removeAttribute('href');
    activateBtn.setAttribute('aria-disabled', 'true');
  }
  if (errorBox) errorBox.hidden = false;
  esimShell?.setAttribute('data-state', 'invalid');
}

addEventListener(
  'pagehide',
  () => {
    stopAutoAdvance();
  },
  { once: true }
);
