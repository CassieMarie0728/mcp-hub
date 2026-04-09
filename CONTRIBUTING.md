# Contributing to MCP Hub

Thanks for contributing. Keep changes focused, tested, and documented.

## Development environment setup

```bash
git clone https://github.com/your-org/mcp-hub.git
cd mcp-hub
pnpm install
cp .env.example .env
pnpm dev
```

## Local development workflow

1. Create a branch from `main`.
2. Implement a scoped change.
3. Run checks locally.
4. Update docs/changelog when behavior changes.
5. Open a PR using the template.

## Coding standards

- Use TypeScript.
- Follow existing file/folder patterns.
- Keep modules small and purpose-driven.
- Run formatting and linting before commit.

## Commit message conventions

Use Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation change
- `refactor:` non-breaking internal cleanup
- `test:` tests only
- `chore:` maintenance

Example:

```text
feat(mcp): add server health indicator for connection screen
```

## Branch naming conventions

- `feature/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `chore/<short-description>`

## Testing requirements

Run these before opening a PR:

```bash
pnpm check
pnpm lint
pnpm test
```

If your change impacts DB schema, also run:

```bash
pnpm db:push
```

## Pull request process

1. Fill out `.github/PULL_REQUEST_TEMPLATE.md`.
2. Link related issue(s).
3. Include test evidence.
4. Call out breaking changes explicitly.

## Code review process

- At least one maintainer approval required.
- Address review comments with follow-up commits.
- Squash-merge preferred unless maintainers request otherwise.
