import {
  formatISODateParts,
  formatISOWeekParts,
  getEpochWeekNumber,
  getISOWeekAndYear,
} from "./dates.js";

const PHI_CONJUGATE = (Math.sqrt(5) - 1) / 2;
const BASE_SIZE = 10;
const MM_TO_PX = 96 / 25.4;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const BENCHMARKS = {
  iso: { prefix: "9999-W", number: "53" },
  day: { prefix: "2026-12-", number: "31" },
  epoch: { prefix: "W", number: "2934" },
};

function measureAt(fontSize, text, bold = false) {
  ctx.font = `${bold ? "bold " : ""}${fontSize}px monospace`;
  return ctx.measureText(text).width;
}

function measurePair(prefixBench, numberBench, prefixSize, numberSize, numberBold) {
  return (
    measureAt(prefixSize, prefixBench, false) +
    measureAt(numberSize, numberBench, numberBold)
  );
}

export function mmToPx(mm) {
  return mm * MM_TO_PX;
}

export function computeFontSizes(kind, maxWidthMm, paddingMm = 0.5) {
  const bench = BENCHMARKS[kind];
  const maxWidthPx = mmToPx(maxWidthMm) - mmToPx(paddingMm) * 2;

  const prefixSizeBase = BASE_SIZE * PHI_CONJUGATE;
  const totalBase = measurePair(
    bench.prefix,
    bench.number,
    prefixSizeBase,
    BASE_SIZE,
    true
  );
  const scale = maxWidthPx / totalBase;

  return {
    prefixSize: prefixSizeBase * scale,
    numberSize: BASE_SIZE * scale,
  };
}

export function lineHeight(fontSize) {
  return fontSize * 1.2;
}

export function fitsInHeight(fontSize, rowHeightMm, lineCount = 1) {
  const lh = lineHeight(fontSize);
  return lh * lineCount <= mmToPx(rowHeightMm);
}

function createLabelLine(prefix, number, sizes) {
  const line = document.createElement("div");
  line.className = "week-label-line";

  const prefixSpan = document.createElement("span");
  prefixSpan.className = "label-prefix";
  prefixSpan.style.fontSize = `${sizes.prefixSize}px`;
  prefixSpan.textContent = prefix;

  const numberSpan = document.createElement("span");
  numberSpan.className = "label-number";
  numberSpan.style.fontSize = `${sizes.numberSize}px`;
  numberSpan.textContent = number;

  line.append(prefixSpan, numberSpan);
  return line;
}

export function buildDayLabel(year, month, day, cellWidthMm) {
  const sizes = computeFontSizes("day", cellWidthMm);
  const { prefix, day: dayStr } = formatISODateParts(year, month, day);

  const prefixSpan = document.createElement("span");
  prefixSpan.className = "label-prefix";
  prefixSpan.style.fontSize = `${sizes.prefixSize}px`;
  prefixSpan.textContent = prefix;

  const numberSpan = document.createElement("span");
  numberSpan.className = "label-number";
  numberSpan.style.fontSize = `${sizes.numberSize}px`;
  numberSpan.textContent = dayStr;

  const wrapper = document.createElement("span");
  wrapper.append(prefixSpan, numberSpan);
  return { element: wrapper, sizes };
}

export function buildWeekLabel(
  mondayTs,
  epochMonday,
  labelMode,
  rowHeightMm,
  weekColWidthMm
) {
  const container = document.createElement("div");
  container.className = "week-label";

  const { isoYear, weekNumber } = getISOWeekAndYear(mondayTs);
  const epochNum = getEpochWeekNumber(mondayTs, epochMonday);

  const lines = [];

  if (labelMode === "iso" || labelMode === "iso+epoch") {
    const sizes = computeFontSizes("iso", weekColWidthMm);
    const { prefix, number } = formatISOWeekParts(isoYear, weekNumber);
    lines.push({ sizes, prefix, number });
  }

  if (labelMode === "epoch" || labelMode === "iso+epoch") {
    const sizes = computeFontSizes("epoch", weekColWidthMm);
    lines.push({ sizes, prefix: "W", number: String(epochNum) });
  }

  const totalLineHeight = lines.reduce(
    (sum, l) => sum + lineHeight(l.sizes.numberSize),
    0
  );
  if (totalLineHeight > mmToPx(rowHeightMm)) {
    console.error("Week label does not fit within row height");
  }

  for (const line of lines) {
    container.appendChild(
      createLabelLine(line.prefix, line.number, line.sizes)
    );
  }

  return container;
}
