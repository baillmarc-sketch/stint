#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Install dependencies so lint/typecheck/build work during the session.
# `pnpm install` (not --frozen) benefits from the post-hook container cache.
pnpm install

echo "Stint deps installed — ready for pnpm lint / typecheck / build."
