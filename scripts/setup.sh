#!/usr/bin/env bash
set -euo pipefail

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install via corepack or npm." >&2
  exit 1
fi

pnpm install

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Setup complete. Run 'pnpm dev' to start development."
