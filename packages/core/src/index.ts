/**
 * @stint/core — framework-free domain logic shared by the Next.js web app and the
 * (future) Expo iOS app. Pure TypeScript: types, money math, the booking state
 * machine, validation schemas, and marketplace config. No React, no Next, no
 * Supabase — so it imports cleanly into a React Native bundle.
 */
export * from "./types/domain";
export * from "./config";
export * from "./booking/pricing";
export * from "./booking/state-machine";
export * from "./validations/booking";
