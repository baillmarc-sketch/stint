/** Money + label formatting shared across web and native. */

/** Format integer cents as a whole-dollar USD string, e.g. 65000 → "$650". */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
