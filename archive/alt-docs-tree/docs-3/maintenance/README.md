# Maintenance Procedures

## Release process

1. Update `CHANGELOG.md`
2. Ensure CI is green
3. Tag release (`vX.Y.Z`)
4. Publish container image
5. Roll out deployment manifests

## Operational checks

- Monitor API error rates
- Monitor MCP server connectivity health
- Monitor macro execution failures

## Dependency updates

- Run dependency updates in dedicated PRs
- Validate with `pnpm check && pnpm lint && pnpm test`

## Incident response

- Capture timeline
- Mitigate customer impact first
- Root-cause analysis
- Publish postmortem and follow-up fixes
