import './i18n';
import { formatDisplayPhone, parseSafeAppleActivationUrl, sanitizePhoneNumber } from './lpa-utils';

const esimShell = document.getElementById('esim-shell');
const activateBtn = document.getElementById('activate-btn') as HTMLAnchorElement | null;
const activateBtnTitle = document.getElementById('activate-btn-title');
const errorBox = document.getElementById('redirect-error');
const phoneBox = document.getElementById('redirect-phone-box');
const phoneNumberEl = document.getElementById('redirect-phone-number');
const walkthroughPhoneEl = document.getElementById('walkthrough-phone-number');
const copyPhoneBtn = document.getElementById('copy-phone-btn') as HTMLButtonElement | null;
const phoneStatusEl = document.getElementById('redirect-phone-status');
const wechatBanner = document.getElementById('wechat-safari-banner');
const motionToggleBtn = document.getElementById('guide-motion-toggle') as HTMLButtonElement | null;
const stepButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-step-target]')];

if (wechatBanner && /MicroMessenger/i.test(navigator.userAgent)) {
  wechatBanner.hidden = false;
}

activateBtn?.addEventListener('click', (event) => {
  if (activateBtn.getAttribute('aria-disabled') === 'true') {
    event.preventDefault();
  }
});

// Single iPhone 18 Pro multi-page walkthrough controller
type StepNum = 1 | 2 | 3 | 4;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let currentStep: StepNum = 1;
let stepTimer = 0;

function setStep(next: StepNum, focusBtn = false) {
  currentStep = next;
  esimShell?.setAttribute('data-step', String(next));
  esimShell?.style.setProperty('--active-step', String(next));

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
const params = new URLSearchParams(window.location.search);
const rawCandidate = params.get('url') || params.get('lpa') || params.get('carddata');
const urlPhone = sanitizePhoneNumber(params.get('phone'));

let displayedPhone = '';
let copyPhoneTimer = 0;
let lastPhoneAnnouncement = '';

function showPhoneNumber(rawPhone: string) {
  if (!phoneBox || !phoneNumberEl) return;
  if (!rawPhone) {
    displayedPhone = '';
    phoneNumberEl.textContent = '';
    if (walkthroughPhoneEl) {
      walkthroughPhoneEl.textContent = '(347) 788-3838';
    }
    phoneBox.hidden = true;
    return;
  }
  displayedPhone = rawPhone;
  phoneNumberEl.textContent = rawPhone;
  if (walkthroughPhoneEl) {
    walkthroughPhoneEl.textContent = rawPhone;
  }
  phoneBox.hidden = false;
}

if (urlPhone) {
  showPhoneNumber(formatDisplayPhone(urlPhone));
}

copyPhoneBtn?.addEventListener('click', async () => {
  const value = displayedPhone || phoneNumberEl?.textContent || '';
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
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

const parsed = parseSafeAppleActivationUrl(rawCandidate);
if (parsed) {
  if (activateBtn) {
    activateBtn.href = parsed.appleUrl;
    activateBtn.removeAttribute('aria-disabled');
  }
  if (activateBtnTitle) activateBtnTitle.textContent = 'Click to Activate';
  if (errorBox) errorBox.hidden = true;
  esimShell?.setAttribute('data-state', 'ready');
} else {
  if (activateBtn) {
    activateBtn.removeAttribute('href');
    activateBtn.setAttribute('aria-disabled', 'true');
  }
  if (activateBtnTitle) activateBtnTitle.textContent = 'Link Unavailable';
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
