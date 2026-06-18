/// <reference types="expo/types" />

// Committed so `tsc` resolves Expo's CSS/asset module imports (e.g. global.css,
// *.module.css) and EXPO_PUBLIC_* env typings in CI — the generated
// `expo-env.d.ts` is git-ignored and absent on a fresh checkout.
