# Dependency Advisory Triage

**Last reviewed:** 2026-08-11

## Outcome

The production audit baseline was reduced from **2 critical, 28 high, 16 moderate, and 5 low** findings to **1 critical, 26 high, 13 moderate, and 4 low** findings through two narrow transitive overrides that resolve successfully within the current Expo SDK 54 dependency graph.

| Package | Resolved version | Result | Rationale |
|---|---:|---|---|
| `shell-quote` | `1.9.0` | Remediated | The React Native developer-tools path accepts the patched version. |
| `body-parser` | `1.20.6` | Remediated | Express 4’s compatible minor line accepts the patched version. |
| `tar` | `7.5.18` | Deferred | Expo CLI 54.0.26 continues to resolve its exact vulnerable Tar release. The audit requires a later Tar patch, but forcing it did not change the generated lockfile. |

The two active overrides are recorded in `pnpm-workspace.yaml`, which is the current project-level location for pnpm settings.[1] The regression contract in `tests/dependency-security-overrides.test.ts` prevents silent removal of those two audited fixes.

## Remaining Risk Classification

The remaining critical advisory is the Expo CLI’s transitive `tar` path. Most remaining high and moderate findings are likewise rooted in the Expo/Metro/React Native toolchain and NativeWind/Tailwind build paths, including `ws`, `undici`, `postcss`, `js-yaml`, `brace-expansion`, `fast-uri`, `ip-address`, `image-size`, and `nanoid`. These deserve monitoring, but broad untested overrides would be worse than the disease: they can silently break Expo SDK 54, Metro, or native compilation.

> **Release reality:** The direct Socket.IO path is gone, and the two compatible patched paths are pinned. The project is still not dependency-clean enough to claim a public production release. The remaining Expo CLI Tar advisory needs an upstream Expo SDK patch or a separately tested framework migration.

## Next Dependency Gate

When Expo publishes an SDK 54-compatible update that changes the bundled CLI dependency graph, rerun:

```bash
pnpm exec expo install --check
pnpm install --frozen-lockfile
pnpm audit --prod --json
pnpm test
pnpm check
pnpm build
```

Do not use a blanket audit auto-fix. Every override must be justified by a known parent range, verified by the resolved dependency tree, and protected by a regression test.

## References

[1]: https://pnpm.io/settings "pnpm project-level workspace settings"
