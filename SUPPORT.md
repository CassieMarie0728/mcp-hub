# Support

This page explains how users, contributors, and evaluators can get help with MCP Hub, whether you are trying to run the project locally, understand the documentation, or report a defect.

## I need help with

| Need | Best place to start |
| --- | --- |
| Understanding the project or setup | [`README.md`](README.md) and [`README.mdx`](README.mdx) |
| Technical documentation | [`docs/`](docs/README.md) |
| Contributing workflow | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Reporting a bug | GitHub Issues using the bug report template |
| Requesting a feature | GitHub Issues using the feature request template |
| Submitting a fix | GitHub pull request using the PR template |
| Community expectations | [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) |

## When to use support, issues, or pull requests

### Use documentation and self-service resources first

Start with the existing repository materials:

- [`README.md`](README.md) for project overview, setup, scripts, and deployment context
- [`README.mdx`](README.mdx) for the documentation landing page used by the docs site
- [`docs/`](docs/README.md) for API, architecture, deployment, development, maintenance, and user guidance
- [`CONTRIBUTING.md`](CONTRIBUTING.md) if you plan to make changes yourself

### Open a GitHub issue when

Use the repository issue templates when you have:

- a reproducible bug
- a documentation problem or unclear setup step
- a feature request or enhancement idea
- a question that can be answered by improving repository guidance

Relevant templates already exist in `.github/ISSUE_TEMPLATE/`:

- `bug_report.md`
- `feature_request.md`
- `custom_template.md`

### Open a pull request when

Open a pull request if you already have a proposed fix, documentation update, or implementation change. Use `.github/PULL_REQUEST_TEMPLATE.md` to summarize:

- what changed
- why it changed
- related issues
- testing performed
- risks or breaking changes

## What to include when asking for help

### Bug reports

Match the existing bug template as closely as possible and include:

- a clear summary
- steps to reproduce
- expected behavior
- actual behavior
- environment details such as OS, Node version, pnpm version, and device/browser
- logs, stack traces, or screenshots when available

### Setup and installation problems

If you are blocked during local setup, include:

- whether you ran `pnpm install`, copied `.env.example` to `.env`, and ran `pnpm db:push`
- the command that failed
- the exact error output
- whether the issue is in the backend server, Expo web app, Android/iOS target, or database connection
- any local environment differences from the documented workflow

### Documentation questions or corrections

For docs-related help, include:

- the file or page you were reading
- the specific section that was unclear or inaccurate
- what you expected to find
- what outcome or task you were trying to complete

## Troubleshooting quick checks

Before opening an issue, try these common checks:

- reinstall dependencies with `pnpm install`
- confirm `.env` exists and required values are set
- run `pnpm check`, `pnpm lint`, and `pnpm test`
- rerun `pnpm db:push` if the issue may involve schema or database setup
- restart the Expo/web workflow with a cleared cache if the frontend appears stale
- confirm port conflicts are not blocking `PORT` or `EXPO_PORT`

## Maintainer expectations

MCP Hub does not currently document a formal support SLA or staffed help desk.

You should expect:

- best-effort responses through the repository workflow
- faster triage when reports are specific and reproducible
- maintainers to prioritize issues that are clearly scoped, actionable, and grounded in the current codebase

## Community conduct

Please follow the standards in [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) when asking for help, filing issues, or participating in pull request discussions.
