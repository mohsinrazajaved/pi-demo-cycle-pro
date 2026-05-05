#!/bin/bash
# Run this on YOUR machine (the developer's). Produces a tarball you can
# email / share / upload — the client unpacks it on the Pi and the app
# updates instantly. No git / node / npm needed on their end.
#
# Usage:
#   ./release.sh           → creates spindeck-build-<short-sha>.tar.gz
#   ./release.sh v1.2.0    → creates spindeck-build-v1.2.0.tar.gz
#
set -euo pipefail

cd "$(dirname "$0")"

# Build the production app
echo "==> npm install (skipped if up to date)…"
npm install --no-audit --no-fund

echo "==> npm run build…"
npm run build

# Tag for the artifact filename: use the user-supplied label, or the short git SHA
TAG="${1:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)}"
ARTIFACT="spindeck-build-${TAG}.tar.gz"

echo "==> packaging ${ARTIFACT}…"
tar czf "${ARTIFACT}" \
  dist \
  hardwareBridge.py \
  spindeck-update.sh

ls -lh "${ARTIFACT}"
echo
echo "Send ${ARTIFACT} to the client. They run on the Pi:"
echo "    ./spindeck-update.sh ${ARTIFACT}"
