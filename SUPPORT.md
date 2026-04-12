# Support

## How to get help

- **Usage questions:** GitHub Discussions (recommended)
- **Bug reports:** GitHub Issues using templates
- **Security concerns:** `security@mcp-hub.example` (private)

## Community resources

- Project README: `README.md`
- Technical docs: `docs/`
- Contributor guide: `CONTRIBUTING.md`

## FAQ

### Which package manager should I use?
Use `pnpm` (project lockfile and scripts are pnpm-first).

### Does MCP Hub support mobile and web?
Yes. It uses Expo/React Native and can run in web and native contexts.

### Where do I configure environment variables?
Copy `.env.example` to `.env` and fill required values.

## Troubleshooting

1. **Install issues**
   - Remove `node_modules` and reinstall with `pnpm install`.
2. **Type errors**
   - Run `pnpm check` and fix reported files.
3. **Server not starting**
   - Validate `.env` values and port availability.
4. **Metro/web issues**
   - Restart with cache clear: `npx expo start --clear`.

## Contact

For maintainers and governance questions: `maintainers@mcp-hub.example`
