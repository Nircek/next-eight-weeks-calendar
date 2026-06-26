import { mmToPx } from "./text-fit.js";

let autoFitPreview = true;
let pageDimensionsMm = { width: 210, height: 297, pageCount: 1 };
let els = null;

function mmToPxFromPage(mm) {
  const page = els?.pages?.querySelector(".print-page");
  if (page) {
    const rect = page.getBoundingClientRect();
    const cssWidth = parseFloat(getComputedStyle(page).width);
    if (cssWidth > 0 && rect.width > 0) {
      return (mm / cssWidth) * rect.width;
    }
  }
  return mmToPx(mm);
}

function getViewportAvailableSize() {
  const viewport = els.previewViewport;
  const styles = getComputedStyle(viewport);
  const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const width =
    Math.max(viewport.clientWidth, viewport.getBoundingClientRect().width) - padX;
  const height =
    Math.max(viewport.clientHeight, viewport.getBoundingClientRect().height) -
    padY;
  return { width: Math.max(0, width), height: Math.max(0, height) };
}

function measureWidth(element, mmFallback) {
  if (element.offsetWidth > 0) return element.offsetWidth;
  const rect = element.getBoundingClientRect();
  if (rect.width > 0) return rect.width;
  return mmToPxFromPage(mmFallback);
}

function measureHeight(element, mmFallback) {
  if (element.offsetHeight > 0) return element.offsetHeight;
  const rect = element.getBoundingClientRect();
  if (rect.height > 0) return rect.height;
  return mmFallback > 0 ? mmToPxFromPage(mmFallback) : 0;
}

export function resetPreviewScaleStyles() {
  els.pagesInner.style.transform = "";
  els.pagesInner.style.width = "";
  els.pagesScaler.style.width = "";
  els.pagesScaler.style.height = "";
  els.pagesScaler.style.overflow = "";
}

function computeFitScale(naturalWidthPx, pageHeightPx) {
  const { width: availableW, height: availableH } = getViewportAvailableSize();
  if (availableW <= 0 || naturalWidthPx <= 0) return null;

  const widthScale = availableW / naturalWidthPx;
  const heightScale =
    availableH > 0 && pageHeightPx > 0 ? availableH / pageHeightPx : widthScale;

  return Math.min(1, widthScale, heightScale);
}

function applyPreviewScale() {
  const firstPage = els.pages.querySelector(".print-page");
  if (!firstPage) return true;

  resetPreviewScaleStyles();
  void els.pages.offsetHeight;

  const { width: pageWidthMm, height: pageHeightMm, pageCount } = pageDimensionsMm;
  const pageGap = parseFloat(getComputedStyle(els.pages).gap) || 32;

  const naturalWidth = measureWidth(firstPage, pageWidthMm);
  const pageHeight = measureHeight(firstPage, pageHeightMm);
  let naturalHeight = measureHeight(els.pages, 0);
  if (naturalHeight <= 0) {
    naturalHeight =
      pageHeight * pageCount + pageGap * Math.max(0, pageCount - 1);
  }

  if (naturalWidth <= 0 || pageHeight <= 0) {
    return false;
  }

  let scale;
  if (autoFitPreview) {
    const fitScale = computeFitScale(naturalWidth, pageHeight);
    if (fitScale === null) {
      return false;
    }
    scale = fitScale;
    const pct = Math.round(scale * 100);
    els.previewScale.value = String(Math.max(10, Math.min(100, pct)));
    els.previewScaleValue.textContent = `${pct}%`;
  } else {
    scale = parseInt(els.previewScale.value, 10) / 100;
    els.previewScaleValue.textContent = `${els.previewScale.value}%`;
  }

  els.pagesInner.style.width = `${naturalWidth}px`;
  els.pagesInner.style.transform = `scale(${scale})`;
  els.pagesInner.style.transformOrigin = "top left";

  els.pagesScaler.style.width = `${naturalWidth * scale}px`;
  els.pagesScaler.style.height = `${naturalHeight * scale}px`;
  els.pagesScaler.style.overflow = "hidden";
  return true;
}

export function schedulePreviewScale() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!applyPreviewScale()) {
        requestAnimationFrame(() => applyPreviewScale());
      }
    });
  });
}

export function setPageDimensions({ width, height, pageCount }) {
  pageDimensionsMm = { width, height, pageCount };
}

export function initPreviewScale(elements) {
  els = elements;

  els.previewScale.addEventListener("input", () => {
    autoFitPreview = false;
    applyPreviewScale();
  });

  els.previewFit.addEventListener("click", () => {
    autoFitPreview = true;
    applyPreviewScale();
  });

  const resizeObserver = new ResizeObserver(() => {
    if (autoFitPreview) applyPreviewScale();
  });
  resizeObserver.observe(els.previewViewport);

  window.addEventListener("resize", () => {
    if (autoFitPreview) applyPreviewScale();
  });

  window.addEventListener("beforeprint", resetPreviewScaleStyles);
}
