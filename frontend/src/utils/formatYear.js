/**
 * Signed historical year formatter for Bharat Through Time
 *
 * Historical convention:
 * - Negative integer: BCE (e.g. -326 -> "326 BCE")
 * - Positive integer: CE (e.g. 1780 -> "1780 CE", 1 -> "1 CE")
 * - Year 0: Historically nonexistent (1 BCE precedes 1 CE directly). Returns empty string / fallback.
 */

export function formatYear(year, fallback = "—") {
  if (year === null || year === undefined || isNaN(year)) {
    return fallback;
  }

  const num = typeof year === "number" ? year : parseInt(year, 10);
  if (isNaN(num)) return fallback;

  if (num === 0) {
    // There is no year 0 in historical chronology
    return fallback;
  }

  if (num < 0) {
    return `${Math.abs(num)} BCE`;
  }

  return `${num} CE`;
}

/**
 * Format a period { startYear, endYear, label }
 * Prefers the curated `label` if present.
 */
export function formatPeriod(period) {
  if (!period) return "—";
  if (period.label && period.label.trim()) {
    return period.label.trim();
  }

  const { startYear, endYear } = period;
  if (typeof startYear !== "number") return "—";

  if (startYear === endYear || typeof endYear !== "number") {
    return formatYear(startYear);
  }

  const startFormatted = formatYear(startYear);
  const endFormatted = formatYear(endYear);

  // If both BCE or both CE, we can present cleanly
  return `${startFormatted} – ${endFormatted}`;
}

export default formatYear;
