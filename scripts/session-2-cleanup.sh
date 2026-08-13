#!/usr/bin/env bash
#
# Session 2 cleanup — deletions the agent could not perform itself.
#
# `rm` returns "Operation not permitted" inside the repo from the agent
# sandbox, but `mv` works, so everything below was RELOCATED rather than
# deleted. Nothing here is referenced by any code that ships; this script just
# finishes the job.
#
# Run from the repo root:  bash scripts/session-2-cleanup.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Removing the Better-T-Stack boilerplate navigation…"
# The starter drawer + tabs routes. Replaced by the real route shape in
# apps/native/app/. Moved out of app/ first so expo-router stopped serving
# them immediately.
rm -rf apps/native/.trash-session-2

echo "Removing session 1's capability probe…"
rm -rf designs/_probe2

echo
echo "Done. Remaining boilerplate that is still WIRED and left on purpose:"
echo "  apps/native/components/container.tsx    — generic, may still be useful"
echo "  apps/native/components/theme-toggle.tsx — used by nothing yet; the"
echo "                                            token probe has its own toggle"
echo "  apps/native/app/+not-found.tsx          — keep"
echo
echo "Delete those yourself if you would rather start clean."

# ── Session 3 ────────────────────────────────────────────────────────────────
# Transfer scaffolding: the agent sandbox cannot delete, only move. Everything
# in .trash-session-3/ is a tarball used to get files across and is safe to go.
rm -rf "$(dirname "$0")/../.trash-session-3"
