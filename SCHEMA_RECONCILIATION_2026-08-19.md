# Tenant Schema Reconciliation — 2026-08-19

The live database was found to contain an older production schema while `drizzle/schema.ts` and the secure MCP repository expected UUID workspace identifiers. The live `workspaces.id` and related `mcp_servers.workspaceId` columns were numeric, while the current application creates UUID workspace IDs. This would make newly authenticated tenant persistence fail at runtime.

The affected live tables—`workspaces`, `mcp_servers`, `mcp_credentials`, `mcp_execution_logs`, `mcp_server_credentials`, and `workspace_members`—were verified to contain **zero rows**. Rather than destructively replacing them, migration `0003_cold_sentry.sql` creates an additive `hub_` namespace that uses the application’s UUID tenant contract, including encrypted assistant provider configuration and one-time assistant tool proposal tables.

No user records or legacy tables are altered. Future secure MCP, assistant, OAuth, webhook, workflow, and execution features use the new `hub_` namespace rather than the historical integer-workspace tables.
