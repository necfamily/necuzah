/**
 * NECUZAH Super Abacus
 * Shared rules for the physical and virtual abacus.
 */

export const ABACUS = Object.freeze({
  lowerBeadsPerRod: 4,
  lowerBeadValue: 1,
  upperBeadValue: 5,
  maxSingleRodValue: 9
});

export function isWholeNumber(value) {
  return Number.isInteger(value) && Number.isFinite(value);
}

export function validateDigit(value) {
  return (
    isWholeNumber(value) &&
    value >= 0 &&
    value <= ABACUS.maxSingleRodValue
  );
}

export function representDigit(value) {
  if (!validateDigit(value)) {
    throw new RangeError("A single rod represents digits from 0 to 9.");
  }

  return {
    upper: value >= 5,
    lower: value % 5
  };
}

export function formatNumber(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6
  }).format(value);
}

export function safeOperation(a, b, operation) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new TypeError("Please enter valid numbers.");
  }

  if (operation === "addition") return a + b;
  if (operation === "subtraction") return a - b;

  throw new Error("Unsupported arithmetic operation.");
}
