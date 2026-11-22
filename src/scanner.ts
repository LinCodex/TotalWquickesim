import './i18n';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import QRCode from 'qrcode';
import {
  encodePhoneParam,
  formatDisplayPhone,
  formatLpaString,
  parseLpaCode,
  sanitizePhoneNumber,
  type LpaData
} from './lpa-utils';

let html5QrCode: Html5Qrcode | null = null;
let isScannerRunning = false;
let isScannerPaused = false;
let isScannerStarting = false;
let activeStream: MediaStream | null = null;
let currentLpa: LpaData | null = null;
let currentPhone = '';
let qrMode: 'redirect' | 'raw' = 'redirect';
let toastTimer = 0;
let qrStatusTimer = 0;
let lastToastMessage = '';
let lastQrStatusMessage = '';

const CAMERA_GRANTED_KEY = 'totalw_camera_granted';
const mobileCameraMedia = matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)');
function isMobileCameraAllowed(): boolean {
  return mobileCameraMedia.matches;
}

function markCameraPermissionGranted() {
  try {
    localStorage.setItem(CAMERA_GRANTED_KEY, 'true');
  } catch {
    // Ignore storage restrictions
  }
}

function clearCameraPermissionIfDenied(err: unknown) {
  const errObj = err as { name?: string; message?: string } | string | null;
  const text = typeof errObj === 'string' ? errObj : `${errObj?.name || ''} ${errObj?.message || ''}`;
  if (/NotAllowedError|PermissionDenied|permission denied/i.test(text)) {
    try {
      localStorage.removeItem(CAMERA_GRANTED_KEY);
    } catch {
      // Ignore storage restrictions
    }
  }
}

async function hasPreviousCameraPermission(): Promise<boolean> {
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return false;
  }
  let storedGrant = false;
  try {
    storedGrant = localStorage.getItem(CAMERA_GRANTED_KEY) === 'true';
  } catch {
    // Ignore storage restrictions
  }

  if (navigator.permissions && typeof navigator.permissions.query === 'function') {
    try {
      const perm = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (perm.state === 'granted') {
        markCameraPermissionGranted();
        return true;
      }
      if (perm.state === 'denied') {
        try {
          localStorage.removeItem(CAMERA_GRANTED_KEY);
        } catch {
          // Ignore storage restrictions
        }
        return false;
      }
    } catch {
      // Ignore browsers where 'camera' permission query is unsupported
    }
  }

  if (typeof navigator.mediaDevices.enumerateDevices === 'function') {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (devices.some((d) => d.kind === 'videoinput' && Boolean(d.label && d.label.trim()))) {
        markCameraPermissionGranted();
        return true;
      }
    } catch {
      // Ignore enumerateDevices errors
    }
  }

  return storedGrant;
}

const scannerContainer = document.querySelector('#mobile-camera-section .lpa-scanner-container') as HTMLElement | null;
const readerElement = document.getElementById('lpa-qr-reader');
const overlayState = document.getElementById('scanner-overlay-state');
const statusText = document.getElementById('scanner-status');
const startBtn = document.getElementById('scanner-start-btn') as HTMLButtonElement | null;
const stopBar = document.getElementById('scanner-stop-bar');
const stopBtn = document.getElementById('scanner-stop-btn') as HTMLButtonElement | null;
const actionRow = document.getElementById('lpa-action-row');
const fileInput = document.getElementById('qr-file-input') as HTMLInputElement | null;
const screenBtn = document.getElementById('screen-cutout-btn') as HTMLButtonElement | null;
const clearTopBtn = document.getElementById('clear-scan-btn') as HTMLButtonElement | null;

const manualForm = document.getElementById('manual-lpa-form') as HTMLFormElement | null;
const smdpInput = document.getElementById('manual-smdp') as HTMLInputElement | null;
const codeInput = document.getElementById('manual-code') as HTMLInputElement | null;
const confirmInput = document.getElementById('manual-confirm') as HTMLInputElement | null;
const phoneInput = document.getElementById('manual-phone') as HTMLInputElement | null;

const resultSection = document.getElementById('lpa-result-section');
const verifySmdp = document.getElementById('verify-smdp');
const verifyCode = document.getElementById('verify-code');
const verifyConfirm = document.getElementById('verify-confirm');
const verifyConfirmRow = document.getElementById('verify-confirm-row');
const verifyPhone = document.getElementById('verify-phone');
const verifyPhoneRow = document.getElementById('verify-phone-row');

const generatedUrlCode = document.getElementById('generated-link-code');
const copyBtn = document.getElementById('copy-link-btn') as HTMLButtonElement | null;
const previewBtn = document.getElementById('preview-link-btn') as HTMLAnchorElement | null;
const wechatBtn = document.getElementById('wechat-share-btn') as HTMLAnchorElement | null;
const toastEl = document.getElementById('lpa-toast');
const qrCanvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement | null;
const qrCaption = document.getElementById('qr-caption');
const copyQrBtn = document.getElementById('copy-qr-btn') as HTMLButtonElement | null;
const qrCopyStatus = document.getElementById('qr-copy-status');
const qrModeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-qr-mode]')];
const resetBtn = document.getElementById('reset-scan-btn') as HTMLButtonElement | null;
const errorBox = document.getElementById('scan-error-box');

if (screenBtn && actionRow && !(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
  screenBtn.hidden = true;
  actionRow.classList.add('is-single');
}

function generateActivationLink(lpa: LpaData, phone?: string): string {
  const params = new URLSearchParams();
  params.set('lpa', formatLpaString(lpa));
  const compactPhone = encodePhoneParam(phone);
  if (compactPhone) {
    params.set('phone', compactPhone);
  }
  return `${window.location.origin}/activate?${params.toString()}`;
}

function getActiveQrPayload(): string | null {
  if (!currentLpa) return null;
  if (qrMode === 'raw') {
    return formatLpaString(currentLpa);
  }
  return generateActivationLink(currentLpa, currentPhone);
}

function showError(msg: string) {
  if (!errorBox) return;
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

function clearError() {
  if (!errorBox) return;
  errorBox.textContent = '';
  errorBox.hidden = true;
}

function showToast(msg: string) {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  const announced = msg === lastToastMessage ? `${msg}\u00A0` : msg;
  lastToastMessage = msg;
  toastEl.hidden = false;
  toastEl.textContent = '';
  requestAnimationFrame(() => {
    toastEl.textContent = announced;
  });
  toastTimer = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 2600);
}

function showQrStatus(msg: string, isError = false) {
  showToast(msg);
  if (!qrCopyStatus || !copyQrBtn) return;
  clearTimeout(qrStatusTimer);
  const announced = msg === lastQrStatusMessage ? `${msg}\u00A0` : msg;
  lastQrStatusMessage = msg;
  copyQrBtn.removeAttribute('data-copied');
  copyQrBtn.removeAttribute('data-failed');
  copyQrBtn.setAttribute(isError ? 'data-failed' : 'data-copied', '');
  qrCopyStatus.textContent = '';
  requestAnimationFrame(() => {
    qrCopyStatus.textContent = announced;
  });
  qrStatusTimer = window.setTimeout(() => {
    copyQrBtn.removeAttribute('data-copied');
    copyQrBtn.removeAttribute('data-failed');
    qrCopyStatus.textContent = '';
  }, 2600);
}

async function renderQr() {
  const payload = getActiveQrPayload();
  if (!qrCanvas || !payload) return;

  if (qrCaption) {
    qrCaption.textContent =
      qrMode === 'raw'
        ? 'Scan from Android eSIM settings or camera:'
        : 'Scan from iPhone camera to open Total Wireless activation page:';
  }

  for (const btn of qrModeButtons) {
    btn.setAttribute('aria-pressed', String(btn.dataset.qrMode === qrMode));
  }

  try {
    await QRCode.toCanvas(qrCanvas, payload, {
      scale: 6,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b1536', light: '#ffffff' }
    });
  } catch (err) {
    console.error('QR rendering error:', err);
  }
}

async function renderQrPngBlob(payload: string): Promise<Blob> {
  const offscreen = document.createElement('canvas');
  await QRCode.toCanvas(offscreen, payload, {
    scale: 10,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b1536', light: '#ffffff' }
  });
  const blob = await new Promise<Blob | null>((resolve) => offscreen.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Unable to encode QR PNG.');
  return blob;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function updatePhoneAndLinkDisplay() {
  if (!currentLpa) return;
  const activationLink = generateActivationLink(currentLpa, currentPhone);

  if (verifyPhone && verifyPhoneRow) {
    if (currentPhone) {
      verifyPhone.textContent = formatDisplayPhone(currentPhone);
      verifyPhoneRow.hidden = false;
    } else {
      verifyPhone.textContent = '';
      verifyPhoneRow.hidden = true;
    }
  }

  if (generatedUrlCode) {
    generatedUrlCode.textContent = activationLink;
  }
  if (previewBtn) {
    previewBtn.href = activationLink;
  }
}

async function displayResult(lpa: LpaData, phone?: string) {
  currentLpa = lpa;
  currentPhone = sanitizePhoneNumber(phone ?? phoneInput?.value);

  if (verifySmdp) verifySmdp.textContent = lpa.smdpAddress;
  if (verifyCode) verifyCode.textContent = lpa.activationCode;

  if (verifyConfirm && verifyConfirmRow) {
    if (lpa.confirmationCode) {
      verifyConfirm.textContent = lpa.confirmationCode;
      verifyConfirmRow.hidden = false;
    } else {
      verifyConfirm.textContent = '';
      verifyConfirmRow.hidden = true;
    }
  }

  updatePhoneAndLinkDisplay();
  await renderQr();

  if (resultSection) {
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  clearError();
}

function getResponsiveQrBox(viewfinderWidth: number, viewfinderHeight: number) {
  const minEdge = Math.min(viewfinderWidth || 260, viewfinderHeight || 260);
  const size = Math.max(150, Math.min(220, Math.floor(minEdge * 0.72)));
  return { width: size, height: size };
}

function pauseScanner() {
  if (!html5QrCode || !isScannerRunning || isScannerPaused) return;
  isScannerPaused = true;
  try {
    html5QrCode.pause(true);
  } catch {
    // Ignore pause transition errors
  }
  scannerContainer?.classList.add('is-paused');
  if (statusText) {
    statusText.textContent = 'QR code scanned — camera paused. Clear / Reset to scan again.';
  }
  if (startBtn) {
    startBtn.hidden = true;
  }
  if (overlayState) {
    overlayState.hidden = false;
  }
}

async function stopScanner() {
  if (html5QrCode && isScannerRunning) {
    try {
      await html5QrCode.stop();
    } catch {
      // Ignore stop error if stream already ended
    }
    try {
      html5QrCode.clear();
    } catch {
      // Ignore clear error
    }
  }
  isScannerRunning = false;
  isScannerPaused = false;
  scannerContainer?.classList.remove('is-paused');
  if (readerElement) readerElement.replaceChildren();
  if (statusText) {
    statusText.textContent = 'Point camera at an eSIM QR code or tap Start Camera.';
  }
  if (startBtn) {
    startBtn.hidden = false;
    startBtn.textContent = 'Start Camera';
  }
  if (overlayState) overlayState.hidden = false;
  if (stopBar) stopBar.hidden = true;
}

async function onCodeDetected(code: string, fromCamera = false) {
  const lpa = parseLpaCode(code);
  if (lpa) {
    if (fromCamera || (isScannerRunning && !isScannerPaused)) {
      pauseScanner();
    }
    if (smdpInput) smdpInput.value = lpa.smdpAddress;
    if (codeInput) codeInput.value = lpa.activationCode;
    if (confirmInput) confirmInput.value = lpa.confirmationCode;
    await displayResult(lpa, phoneInput?.value);
  } else if (!fromCamera) {
    showError(`QR code scanned, but it does not match eSIM LPA format: ${code.slice(0, 40)}`);
  }
}

async function startScanner() {
  if (!readerElement || !isMobileCameraAllowed() || isScannerStarting) return;
  isScannerStarting = true;
  await stopScanner();
  clearError();

  if (statusText) statusText.textContent = 'Starting camera…';
  if (startBtn) {
    startBtn.hidden = false;
    startBtn.disabled = true;
  }

  try {
    html5QrCode = new Html5Qrcode('lpa-qr-reader', {
      verbose: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
    });

    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 20,
        qrbox: getResponsiveQrBox,
        disableFlip: false
      },
      (decodedText) => {
        if (isScannerPaused) return;
        void onCodeDetected(decodedText, true);
      },
      () => {}
    );

    isScannerRunning = true;
    isScannerPaused = false;
    markCameraPermissionGranted();
    scannerContainer?.classList.remove('is-paused');
    if (overlayState) overlayState.hidden = true;
    if (stopBar) stopBar.hidden = false;
  } catch (err) {
    console.warn('Camera access unavailable or denied:', err);
    clearCameraPermissionIfDenied(err);
    isScannerRunning = false;
    isScannerPaused = false;
    scannerContainer?.classList.remove('is-paused');
    if (readerElement) readerElement.replaceChildren();
    if (overlayState) overlayState.hidden = false;
    if (stopBar) stopBar.hidden = true;
    if (statusText) {
      statusText.textContent = 'Camera unavailable. You can upload an image or enter manually below.';
    }
    if (startBtn) {
      startBtn.hidden = false;
      startBtn.textContent = 'Retry Camera';
    }
  } finally {
    isScannerStarting = false;
    if (startBtn) startBtn.disabled = false;
  }
}

async function resumeOrRestartScanner() {
  if (html5QrCode && isScannerRunning && isScannerPaused) {
    const video = readerElement?.querySelector('video') as HTMLVideoElement | null;
    const track = (video?.srcObject as MediaStream | null)?.getVideoTracks?.()[0];
    if (track && track.readyState === 'live') {
      try {
        html5QrCode.resume();
        isScannerPaused = false;
        scannerContainer?.classList.remove('is-paused');
        if (overlayState) overlayState.hidden = true;
        if (startBtn) startBtn.hidden = false;
        if (stopBar) stopBar.hidden = false;
        return;
      } catch {
        // Fall through to full restart
      }
    }
  }
  if (isMobileCameraAllowed() && (await hasPreviousCameraPermission())) {
    await startScanner();
  } else {
    await stopScanner();
  }
}

async function scanImageFile(file: File) {
  const tempId = `lpa-scan-temp-${Date.now()}`;
  const tempDiv = document.createElement('div');
  tempDiv.id = tempId;
  tempDiv.className = 'sr-only';
  document.body.appendChild(tempDiv);

  try {
    const scanner = new Html5Qrcode(tempId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });
    const result = await scanner.scanFile(file, false);
    await scanner.clear();
    await onCodeDetected(result, false);
  } catch {
    showError('Could not read a QR code from this image. Please ensure the code is clear and well-lit.');
  } finally {
    tempDiv.remove();
  }
}

function handleResetAll() {
  if (resultSection) resultSection.hidden = true;
  clearError();
  if (toastEl) toastEl.hidden = true;
  if (qrCopyStatus) qrCopyStatus.textContent = '';
  copyQrBtn?.removeAttribute('data-copied');
  copyQrBtn?.removeAttribute('data-failed');
  if (smdpInput) smdpInput.value = '';
  if (codeInput) codeInput.value = '';
  if (confirmInput) confirmInput.value = '';
  if (phoneInput) phoneInput.value = '';
  currentLpa = null;
  currentPhone = '';
  void resumeOrRestartScanner();
}

mobileCameraMedia.addEventListener('change', () => {
  if (!isMobileCameraAllowed()) {
    void stopScanner();
  }
});

startBtn?.addEventListener('click', () => {
  void startScanner();
});

stopBtn?.addEventListener('click', () => {
  void stopScanner();
});

clearTopBtn?.addEventListener('click', handleResetAll);
resetBtn?.addEventListener('click', handleResetAll);

fileInput?.addEventListener('change', async (event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    await scanImageFile(file);
  } finally {
    target.value = '';
  }
});

screenBtn?.addEventListener('click', async () => {
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
    screenBtn.classList.remove('active');
    return;
  }

  try {
    screenBtn.classList.add('active');
    activeStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'monitor', cursor: 'never' } as MediaTrackConstraints,
      preferCurrentTab: false
    } as DisplayMediaStreamOptions);

    const video = document.createElement('video');
    video.srcObject = activeStream;
    video.autoplay = true;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        void video.play();
        resolve();
      };
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0);

    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
    screenBtn.classList.remove('active');

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Capture failed');

    const file = new File([blob], 'screenshot.png', { type: 'image/png' });
    await scanImageFile(file);
  } catch (err: unknown) {
    screenBtn.classList.remove('active');
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop());
      activeStream = null;
    }
    const errObj = err as { name?: string; message?: string };
    if (errObj?.name !== 'NotAllowedError') {
      showError(`Screen cutout capture failed: ${errObj?.message || 'No QR found.'}`);
    }
  }
});

function maybeSplitFullLpaInput(raw: string) {
  const parsed = parseLpaCode(raw);
  if (!parsed) return false;
  if (smdpInput) smdpInput.value = parsed.smdpAddress;
  if (codeInput) codeInput.value = parsed.activationCode;
  if (confirmInput) confirmInput.value = parsed.confirmationCode;
  return true;
}

smdpInput?.addEventListener('input', () => {
  const val = smdpInput.value.trim();
  if (/^(?:LPA:)?1\$|carddata=/i.test(val)) {
    if (maybeSplitFullLpaInput(val)) {
      const parsed = parseLpaCode(val);
      if (parsed) {
        void displayResult(parsed, phoneInput?.value);
      }
    }
  }
});

phoneInput?.addEventListener('input', () => {
  if (!currentLpa) return;
  currentPhone = sanitizePhoneNumber(phoneInput.value);
  updatePhoneAndLinkDisplay();
  if (qrMode === 'redirect') {
    void renderQr();
  }
});

manualForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawSmdp = smdpInput?.value.trim() || '';
  const rawCode = codeInput?.value.trim() || '';
  const rawConfirm = confirmInput?.value.trim() || '';
  const rawPhone = phoneInput?.value || '';

  if (/^(?:LPA:)?1\$|carddata=/i.test(rawSmdp)) {
    const parsed = parseLpaCode(rawSmdp);
    if (parsed) {
      void displayResult(parsed, rawPhone);
      return;
    }
  }

  if (!rawSmdp || !rawCode) {
    showError('Please enter both SM-DP+ Address and Activation Code.');
    return;
  }

  if (/[$\s<>"]/.test(rawSmdp) || /[$\s<>"]/.test(rawCode)) {
    showError('Please enter valid SM-DP+ Address and Activation Code without spaces or $ characters.');
    return;
  }

  void displayResult(
    {
      smdpAddress: rawSmdp,
      activationCode: rawCode,
      confirmationCode: rawConfirm
    },
    rawPhone
  );
});

for (const btn of qrModeButtons) {
  btn.addEventListener('click', () => {
    qrMode = btn.dataset.qrMode === 'raw' ? 'raw' : 'redirect';
    void renderQr();
  });
}

copyBtn?.addEventListener('click', async () => {
  const text = generatedUrlCode?.textContent || '';
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Link copied to clipboard.');
  } catch {
    showError('Failed to copy to clipboard.');
  }
});

wechatBtn?.addEventListener('click', () => {
  const text = generatedUrlCode?.textContent || '';
  if (text) {
    navigator.clipboard.writeText(text).catch(() => {});
    showToast('Link copied. Open WeChat to paste and share.');
  }
});

copyQrBtn?.addEventListener('click', async () => {
  const payload = getActiveQrPayload();
  if (!payload) return;

  try {
    const blobPromise = renderQrPngBlob(payload);
    if ('ClipboardItem' in window && typeof navigator.clipboard?.write === 'function') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
      showQrStatus('QR image copied to clipboard.');
      return;
    }
    const blob = await blobPromise;
    downloadBlob(blob, qrMode === 'raw' ? 'total-wireless-esim-lpa-qr.png' : 'total-wireless-esim-quicklink-qr.png');
    showQrStatus('QR image downloaded.');
  } catch {
    try {
      const blob = await renderQrPngBlob(payload);
      downloadBlob(blob, qrMode === 'raw' ? 'total-wireless-esim-lpa-qr.png' : 'total-wireless-esim-quicklink-qr.png');
      showQrStatus('QR image downloaded.');
    } catch {
      showQrStatus('Failed to copy QR image.', true);
    }
  }
});

if (isMobileCameraAllowed()) {
  void hasPreviousCameraPermission().then((granted) => {
    if (granted && isMobileCameraAllowed() && !isScannerRunning && !isScannerStarting && !currentLpa) {
      void startScanner();
    }
  });
}

addEventListener('pagehide', () => {
  void stopScanner();
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
  }
});
