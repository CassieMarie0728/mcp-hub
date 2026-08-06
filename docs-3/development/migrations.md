# Migration Guide

## Database migrations

Use Drizzle commands:

```bash
pnpm db:push
```

Commit generated artifacts under `drizzle/` and validate app startup after schema change.
