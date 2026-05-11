#!/usr/bin/env bash
# Run the dev environment (server + client) on Linux/macOS.
# Usage: scripts/dev.sh
set -euo pipefail
cd "$(dirname "$0")/.."
npm run dev
