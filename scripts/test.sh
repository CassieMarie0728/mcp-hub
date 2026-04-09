#!/usr/bin/env bash
set -euo pipefail

pnpm check
pnpm lint
pnpm test
