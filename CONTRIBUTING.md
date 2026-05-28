# Contributing to MCP Hub

This guide is for contributors who want to improve MCP Hub across the app, backend, infrastructure, and documentation. Keep changes focused, tested, and grounded in the current repository implementation.

## Contribution principles

- Prefer small, reviewable pull requests.
- Keep documentation aligned with code.
- Avoid describing repository feature modules as public API surfaces unless they are clearly mounted in the runtime.
- Preserve existing project structure and naming patterns unless a change explicitly requires refactoring.

## Prerequisites

Before you start, make sure you have:

- Node.js 20 or newer
- pnpm 9.12.0 or newer
- access to a MySQL-compatible database for `DATABASE_URL`
- optional Expo mobile tooling if you plan to run Android or iOS locally

## First-time setup

Use the repository helper script or run the setup manually.

```bash
./scripts/setup.sh
```

Manual setup:

```bash
git clone https://github.com/CassieMarie0728/mcp-hub.git
cd mcp-hub
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

The setup script installs dependencies and creates `.env` from `.env.example` if it does not already exist.

## Environment configuration

Review `.env.example` and set values appropriate for your machine:

- `PORT` for the backend server
- `EXPO_PORT` for the Expo web app
- `DATABASE_URL` for the MySQL-compatible database
- `COOKIE_SECRET` and `JWT_SECRET` for local auth/session behavior
- any integration values you need for testing

## Local development workflow

1. Create a branch from `main`.
2. Make one scoped change at a time.
3. Run the relevant local checks.
4. Update documentation when behavior, setup, architecture, or API expectations change.
5. Open a pull request using the repository template.

A typical full-stack loop is:

```bash
pnpm dev
```

This runs the backend watcher and the Expo web development server together.

## Script reference

| Command           | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `pnpm dev`        | Run backend and Expo web development together |
| `pnpm dev:server` | Watch and restart the backend entry point     |
| `pnpm dev:metro`  | Start Expo for web                            |
| `pnpm build`      | Build the production server bundle            |
| `pnpm start`      | Start the built production server             |
| `pnpm check`      | Type-check the codebase                       |
| `pnpm lint`       | Run linting                                   |
| `pnpm format`     | Format the repository with Prettier           |
| `pnpm test`       | Run the Vitest suite                          |
| `pnpm db:push`    | Generate and apply Drizzle migrations         |
| `pnpm android`    | Run the Android target                        |
| `pnpm ios`        | Run the iOS target                            |

## Coding and style expectations

The repository currently uses:

- TypeScript in strict mode via `tsconfig.json`
- 2-space indentation and LF line endings via `.editorconfig`
- Expo and recommended ESLint rules via `.eslintrc`
- Prettier with semicolons, single quotes, trailing commas, and 100-column print width via `.prettierrc`

When contributing:

- use TypeScript for application and server changes
- follow existing folder and module boundaries
- keep modules purpose-driven and readable
- run formatting and linting before opening a PR
- avoid large unrelated cleanup in feature branches

## Commit message conventions

Use Conventional Commits where possible:

- `feat:` new functionality
- `fix:` bug fixes
- `docs:` documentation-only changes
- `refactor:` internal cleanup without intended behavior change
- `test:` test changes
- `chore:` maintenance work

Example:

```text
feat(mcp): add server health indicator for connection screen
```

## Branch naming conventions

Preferred branch names:

- `feature/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `chore/<short-description>`

## Testing expectations

Run the standard local checks before submitting a pull request:

```bash
./scripts/test.sh
```

Equivalent manual commands:

```bash
pnpm check
pnpm lint
pnpm test
```

If your change affects schema or persistence behavior, also run:

```bash
pnpm db:push
```

Add or update tests when changing app logic, backend procedures, or integration behavior.

## Database and schema workflow

MCP Hub currently uses Drizzle with MySQL-oriented schema definitions.

When changing the schema:

1. update `drizzle/schema.ts`
2. run `pnpm db:push`
3. verify generated migration output if applicable
4. test against a local database before opening a PR
5. update documentation if setup or schema assumptions changed

## Documentation contributions

Documentation changes are part of the product surface.

When updating docs:

- prefer repository facts over assumptions
- verify backend/API claims against `server/_core/index.ts` and `server/routers.ts`
- avoid documenting a repository module as a mounted or public API unless code confirms it
- update related docs together when a change affects setup, architecture, or usage

## Pull request expectations

Before opening a pull request:

- fill out `.github/PULL_REQUEST_TEMPLATE.md`
- link related issues when applicable
- summarize what changed and why
- include testing evidence
- call out breaking changes or migration impact explicitly
- mention documentation changes when relevant

### PR author checklist

- [ ] My branch is scoped to one clear change
- [ ] I ran `pnpm check`, `pnpm lint`, and `pnpm test`
- [ ] I ran `pnpm db:push` if schema-related behavior changed
- [ ] I updated docs/changelog where needed
- [ ] I verified technical claims against the current codebase

## Issue reporting

Use the existing GitHub templates in `.github/ISSUE_TEMPLATE/`:

- `bug_report.md` for defects
- `feature_request.md` for proposed enhancements
- `custom_template.md` for issues that do not fit the standard flows

Include reproduction steps, environment details, expected behavior, and actual behavior whenever possible.

## Code review process

- expect maintainer review before merge
- address review comments with targeted follow-up commits
- keep discussion tied to the scope of the change
- prefer clear commit history unless maintainers request a different merge strategy
