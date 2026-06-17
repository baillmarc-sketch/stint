/**
 * Domain types now live in the shared `@stint/core` package so the web app and the
 * (future) Expo iOS app use one source of truth. Re-exported here so existing
 * `@/types/domain` imports across the web app keep working unchanged.
 */
export * from "@stint/core/types";
