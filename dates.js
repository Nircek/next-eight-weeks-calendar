const MS_PER_DAY = 86400000;

export function getISOWeekAndYear(timestamp) {
  const date = new Date(timestamp);
  const day = date.getUTCDay() || 7;
  const thursday = timestamp + (4 - day) * MS_PER_DAY;
  const thursdayDate = new Date(thursday);
  const isoYear = thursdayDate.getUTCFullYear();

  const jan4 = Date.UTC(isoYear, 0, 4);
  const jan4Day = new Date(jan4).getUTCDay() || 7;
  const week1Monday = jan4 - (jan4Day - 1) * MS_PER_DAY;

  const weekNumber =
    Math.floor((timestamp - week1Monday) / MS_PER_DAY / 7) + 1;
  return { isoYear, weekNumber };
}

export function getMondayFromISOWeek(isoYear, weekNumber) {
  const jan4 = Date.UTC(isoYear, 0, 4);
  const jan4Day = new Date(jan4).getUTCDay() || 7;
  const week1Monday = jan4 - (jan4Day - 1) * MS_PER_DAY;
  return week1Monday + (weekNumber - 1) * 7 * MS_PER_DAY;
}

export function getMondayOfISOWeekContaining(timestamp) {
  const day = new Date(timestamp).getUTCDay() || 7;
  return timestamp - (day - 1) * MS_PER_DAY;
}

export function parseWeekInput(value) {
  const match = value.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  return getMondayFromISOWeek(
    parseInt(match[1], 10),
    parseInt(match[2], 10)
  );
}

export function parseUTCDateString(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return Date.UTC(
    parseInt(match[1], 10),
    parseInt(match[2], 10) - 1,
    parseInt(match[3], 10)
  );
}

export function parseDateInput(value) {
  const ts = parseUTCDateString(value);
  if (ts === null) return null;
  return getMondayOfISOWeekContaining(ts);
}

export function formatWeekInput(mondayTs) {
  const { isoYear, weekNumber } = getISOWeekAndYear(mondayTs);
  return `${isoYear}-W${String(weekNumber).padStart(2, "0")}`;
}

export function formatDateInput(mondayTs) {
  const d = new Date(mondayTs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getEpochWeekNumber(rowMonday, epochMonday) {
  return Math.floor((rowMonday - epochMonday) / MS_PER_DAY / 7) + 1;
}

export function getCalendarDateParts(timestamp) {
  const d = new Date(timestamp);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function getCurrentISOMondayUTC() {
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return getMondayOfISOWeekContaining(todayUtc);
}

export function getTodayDateUTC() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatISODate(timestamp) {
  const { year, month, day } = getCalendarDateParts(timestamp);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatISOWeekNumber(weekNumber) {
  return String(weekNumber).padStart(2, "0");
}

export function formatISOWeekParts(isoYear, weekNumber) {
  return {
    prefix: `${isoYear}-W`,
    number: formatISOWeekNumber(weekNumber),
  };
}

export function formatISODateParts(year, month, day) {
  return {
    prefix: `${year}-${String(month).padStart(2, "0")}-`,
    day: String(day).padStart(2, "0"),
  };
}

export function addDays(timestamp, days) {
  return timestamp + days * MS_PER_DAY;
}

export function supportsWeekInput() {
  const input = document.createElement("input");
  input.type = "week";
  return input.type !== "text";
}
