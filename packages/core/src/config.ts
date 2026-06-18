/**
 * Marketplace economics. Surfaced as a checkout line item even while payments are
 * simulated. Read from env when present (the web app inlines `NEXT_PUBLIC_*` at
 * build); guarded so it's safe in a React Native runtime with no `process`.
 */
const fromEnv =
  typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SERVICE_FEE_PCT : undefined;

export const SERVICE_FEE_PCT = Number(fromEnv ?? 0.12);
