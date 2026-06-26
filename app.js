import {
  addDays,
  formatDateInput,
  formatISODate,
  formatWeekInput,
  getCalendarDateParts,
  getCurrentISOMondayUTC,
  getEpochWeekNumber,
  getISOWeekAndYear,
  getMondayOfISOWeekContaining,
  getTodayDateUTC,
  parseDateInput,
  parseWeekInput,
  supportsWeekInput,
} from "./dates.js";
import {
  initPreviewScale,
  schedulePreviewScale,
  setPageDimensions,
} from "./preview-scale.js";
import { buildDayLabel, buildWeekLabel, fitsInHeight } from "./text-fit.js";

const WEEK_COL_WIDTH = 16.8;

const PAPER_PRESETS = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

const els = {
  startWeek: document.getElementById("start-week"),
  epochWeek: document.getElementById("epoch-week"),
  labelMode: document.getElementById("label-mode"),
  totalWeeks: document.getElementById("total-weeks"),
  weeksPerPage: document.getElementById("weeks-per-page"),
  paperPreset: document.getElementById("paper-preset"),
  pageWidth: document.getElementById("page-width"),
  pageHeight: document.getElementById("page-height"),
  marginTop: document.getElementById("margin-top"),
  marginBottom: document.getElementById("margin-bottom"),
  marginLeft: document.getElementById("margin-left"),
  marginRight: document.getElementById("margin-right"),
  liveSummary: document.getElementById("live-summary"),
  previewScale: document.getElementById("preview-scale"),
  previewScaleValue: document.getElementById("preview-scale-value"),
  previewFit: document.getElementById("preview-fit"),
  previewViewport: document.getElementById("preview-viewport"),
  pagesScaler: document.getElementById("pages-scaler"),
  pagesInner: document.getElementById("pages-inner"),
  borderOuter: document.getElementById("border-outer"),
  borderVertical: document.getElementById("border-vertical"),
  borderHorizontal: document.getElementById("border-horizontal"),
  swatchOuter: document.getElementById("swatch-outer"),
  swatchVertical: document.getElementById("swatch-vertical"),
  swatchHorizontal: document.getElementById("swatch-horizontal"),
  valueOuter: document.getElementById("value-outer"),
  valueVertical: document.getElementById("value-vertical"),
  valueHorizontal: document.getElementById("value-horizontal"),
  pages: document.getElementById("pages"),
};

const useWeekInput = supportsWeekInput();

let renderFrame;

function scheduleRender() {
  if (renderFrame) cancelAnimationFrame(renderFrame);
  renderFrame = requestAnimationFrame(render);
}

function applyPaperPreset(preset) {
  if (preset === "custom") return;
  const size = PAPER_PRESETS[preset];
  if (!size) return;
  els.pageWidth.value = String(size.width);
  els.pageHeight.value = String(size.height);
}

function syncPaperPresetFromDimensions() {
  for (const [key, size] of Object.entries(PAPER_PRESETS)) {
    if (
      parseNum(els.pageWidth) === size.width &&
      parseNum(els.pageHeight) === size.height
    ) {
      if (els.paperPreset.value !== key) {
        els.paperPreset.value = key;
      }
      return;
    }
  }
  if (els.paperPreset.value !== "custom") {
    els.paperPreset.value = "custom";
  }
}

function parseNum(input) {
  const n = parseFloat(input.value);
  return Number.isFinite(n) ? n : 0;
}

function greyscale(level) {
  const v = Math.round(255 - (level / 100) * 255);
  return `rgb(${v}, ${v}, ${v})`;
}

function updateBorderUI() {
  const outer = parseInt(els.borderOuter.value, 10);
  const vertical = parseInt(els.borderVertical.value, 10);
  const horizontal = parseInt(els.borderHorizontal.value, 10);

  const outerColor = greyscale(outer);
  const verticalColor = greyscale(vertical);
  const horizontalColor = greyscale(horizontal);

  document.documentElement.style.setProperty("--border-outer", outerColor);
  document.documentElement.style.setProperty("--border-vertical", verticalColor);
  document.documentElement.style.setProperty(
    "--border-horizontal",
    horizontalColor
  );

  els.swatchOuter.style.backgroundColor = outerColor;
  els.swatchVertical.style.backgroundColor = verticalColor;
  els.swatchHorizontal.style.backgroundColor = horizontalColor;

  els.valueOuter.textContent = `${outer}%`;
  els.valueVertical.textContent = `${vertical}%`;
  els.valueHorizontal.textContent = `${horizontal}%`;
}

function configureWeekInputs() {
  const inputs = [els.startWeek, els.epochWeek];
  for (const input of inputs) {
    input.type = useWeekInput ? "week" : "date";
  }

  if (useWeekInput) {
    els.startWeek.value = formatWeekInput(getCurrentISOMondayUTC());
    els.epochWeek.value = "1970-W01";
  } else {
    els.startWeek.value = getTodayDateUTC();
    els.epochWeek.value = "1970-01-01";
  }
}

function parseWeekOrDateInput(input) {
  if (useWeekInput) {
    return parseWeekInput(input.value);
  }
  return parseDateInput(input.value);
}

function clampStartToEpoch() {
  const startMonday = parseWeekOrDateInput(els.startWeek);
  const epochMonday = parseWeekOrDateInput(els.epochWeek);
  if (startMonday == null || epochMonday == null) return epochMonday;

  if (startMonday < epochMonday) {
    const clampedValue = useWeekInput
      ? formatWeekInput(getMondayOfISOWeekContaining(epochMonday))
      : formatDateInput(getMondayOfISOWeekContaining(epochMonday));
    if (els.startWeek.value !== clampedValue) {
      els.startWeek.value = clampedValue;
    }
    return epochMonday;
  }
  return startMonday;
}

function formatISORange(startMonday, endMonday) {
  const start = getISOWeekAndYear(startMonday);
  const end = getISOWeekAndYear(endMonday);
  const startLabel = `${start.isoYear}-W${String(start.weekNumber).padStart(2, "0")}`;
  if (start.isoYear === end.isoYear && start.weekNumber === end.weekNumber) {
    return startLabel;
  }
  if (start.isoYear === end.isoYear) {
    return `${startLabel} – W${String(end.weekNumber).padStart(2, "0")}`;
  }
  const endLabel = `${end.isoYear}-W${String(end.weekNumber).padStart(2, "0")}`;
  return `${startLabel} – ${endLabel}`;
}

function formatEpochRange(startEpoch, endEpoch) {
  if (startEpoch === endEpoch) return `W${startEpoch}`;
  return `W${startEpoch} – W${endEpoch}`;
}

function updateLiveSummary({
  cellWidth,
  rowHeight,
  pageCount,
  startMonday,
  endSunday,
  endMonday,
  epochMonday,
}) {
  const dateRange = `${formatISODate(startMonday)} – ${formatISODate(endSunday)}`;
  const isoRange = formatISORange(startMonday, endMonday);
  const startEpoch = getEpochWeekNumber(startMonday, epochMonday);
  const endEpoch = getEpochWeekNumber(endMonday, epochMonday);
  const epochRange = formatEpochRange(startEpoch, endEpoch);
  const pageLabel = pageCount === 1 ? "1 page" : `${pageCount} pages`;

  els.liveSummary.textContent = [
    `Cell ${cellWidth.toFixed(2)} × ${rowHeight.toFixed(2)} mm`,
    pageLabel,
    dateRange,
    `ISO ${isoRange}`,
    `Epoch ${epochRange}`,
  ].join(" · ");
}

function render() {
  updateBorderUI();

  const pageWidth = parseNum(els.pageWidth);
  const pageHeight = parseNum(els.pageHeight);
  const marginTop = parseNum(els.marginTop);
  const marginBottom = parseNum(els.marginBottom);
  const marginLeft = parseNum(els.marginLeft);
  const marginRight = parseNum(els.marginRight);
  const weeksPerPage = Math.max(1, parseInt(els.weeksPerPage.value, 10) || 1);
  const totalWeeks = Math.max(1, parseInt(els.totalWeeks.value, 10) || 1);
  const labelMode = els.labelMode.value;

  const rowHeight = (pageHeight - marginTop - marginBottom) / weeksPerPage;
  const cellWidth =
    (pageWidth - marginLeft - marginRight - WEEK_COL_WIDTH) / 7;

  const epochMonday = parseWeekOrDateInput(els.epochWeek);
  if (epochMonday == null) return;

  const startMonday = clampStartToEpoch();
  if (startMonday == null) return;

  const weeks = [];
  for (let i = 0; i < totalWeeks; i++) {
    weeks.push(addDays(startMonday, i * 7));
  }

  const endMonday = weeks[weeks.length - 1];
  const endSunday = addDays(endMonday, 6);
  const pageCount = Math.ceil(totalWeeks / weeksPerPage);
  const globalLastRowIndex = totalWeeks - 1;

  setPageDimensions({ width: pageWidth, height: pageHeight, pageCount });

  updateLiveSummary({
    cellWidth,
    rowHeight,
    pageCount,
    startMonday,
    endSunday,
    endMonday,
    epochMonday,
  });

  const fragment = document.createDocumentFragment();

  for (let p = 0; p < pageCount; p++) {
    const pageStart = p * weeksPerPage;
    const pageWeeks = weeks.slice(pageStart, pageStart + weeksPerPage);

    const page = document.createElement("div");
    page.className = "print-page";
    page.style.setProperty("--page-width", `${pageWidth}mm`);
    page.style.setProperty("--page-height", `${pageHeight}mm`);
    page.style.setProperty("--margin-top", `${marginTop}mm`);
    page.style.setProperty("--margin-right", `${marginRight}mm`);
    page.style.setProperty("--margin-bottom", `${marginBottom}mm`);
    page.style.setProperty("--margin-left", `${marginLeft}mm`);
    page.style.setProperty("--row-height", `${rowHeight}mm`);
    page.style.setProperty("--week-col-width", `${WEEK_COL_WIDTH}mm`);
    page.style.setProperty("--cell-width", `${cellWidth}mm`);

    const body = document.createElement("div");
    body.className = "page-body";

    pageWeeks.forEach((mondayTs, pageRowIndex) => {
      const globalRowIndex = pageStart + pageRowIndex;
      const isFirstRowOnPage = pageRowIndex === 0;
      const isGlobalLastRow = globalRowIndex === globalLastRowIndex;

      const row = document.createElement("div");
      row.className = "calendar-row";

      row.appendChild(
        buildWeekLabel(
          mondayTs,
          epochMonday,
          labelMode,
          rowHeight,
          WEEK_COL_WIDTH
        )
      );

      const dayGrid = document.createElement("div");
      dayGrid.className = "day-grid";
      if (isFirstRowOnPage) {
        dayGrid.classList.add("outer-top");
      }

      for (let d = 0; d < 7; d++) {
        const dayTs = addDays(mondayTs, d);
        const { year, month, day } = getCalendarDateParts(dayTs);

        const cell = document.createElement("div");
        cell.className = "day-cell";

        if (d === 0) {
          cell.classList.add("border-outer-left");
        }
        if (d < 6) {
          cell.classList.add("border-vertical-right");
        } else {
          cell.classList.add("border-outer-right");
        }
        if (isGlobalLastRow) {
          cell.classList.add("border-outer-bottom");
        } else {
          cell.classList.add("border-horizontal-bottom");
        }

        const { element: dayLabel, sizes: daySizes } = buildDayLabel(
          year,
          month,
          day,
          cellWidth
        );
        if (!fitsInHeight(daySizes.numberSize, rowHeight)) {
          console.error("Day label does not fit within row height");
        }

        cell.appendChild(dayLabel);
        dayGrid.appendChild(cell);
      }

      row.appendChild(dayGrid);
      body.appendChild(row);
    });

    page.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "page-footer";
    footer.textContent = window.location.href;
    page.appendChild(footer);

    fragment.appendChild(page);
  }

  els.pages.replaceChildren(fragment);
  schedulePreviewScale();
}

function init() {
  configureWeekInputs();
  updateBorderUI();
  initPreviewScale(els);

  const inputs = [
    els.startWeek,
    els.epochWeek,
    els.labelMode,
    els.totalWeeks,
    els.weeksPerPage,
    els.pageWidth,
    els.pageHeight,
    els.marginTop,
    els.marginBottom,
    els.marginLeft,
    els.marginRight,
    els.borderOuter,
    els.borderVertical,
    els.borderHorizontal,
  ];

  for (const input of inputs) {
    input.addEventListener("input", scheduleRender);
  }

  els.paperPreset.addEventListener("change", () => {
    applyPaperPreset(els.paperPreset.value);
    scheduleRender();
  });

  els.pageWidth.addEventListener("input", syncPaperPresetFromDimensions);
  els.pageHeight.addEventListener("input", syncPaperPresetFromDimensions);

  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }
}

init();
