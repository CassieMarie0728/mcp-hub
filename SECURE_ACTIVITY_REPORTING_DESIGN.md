# Secure Activity Reporting Design

## Purpose

This milestone unlocks execution history and analytics using only records written by the authorized MCP runtime. It replaces the retired device-local history and in-memory analytics surfaces without reintroducing client-side recording, cross-workspace reads, request payload retention, response payload retention, or fabricated metrics.

## Source of Truth

The durable `mcp_execution_logs` table is the exclusive source for activity reporting. The secure operation layer writes an append-only record after every authorized discovery, execution, or connection test. Each record carries a workspace identifier, an owned server identifier, operation kind, optional tool name, success outcome, elapsed duration, sanitized error summary, and creation time.

| Concern | Design decision |
|---|---|
| Ownership boundary | Every read filters on `workspaceId` resolved from the authenticated user’s personal workspace. |
| Server filter | A requested server ID is combined with the workspace predicate; an ID from another workspace therefore returns no activity. |
| Credentials and headers | Never selected, returned, aggregated, or stored in the execution log read path. |
| Tool input and output | Never retained in the activity log and never exposed through history or analytics. |
| Error detail | Only the existing sanitized, bounded execution error summary may appear in history. Analytics uses counts rather than error text. |
| Retention and deletion | The schema is append-only. This milestone does not claim user-controlled history deletion or retention controls that do not yet exist. |

## Protected API Contract

The existing `analytics` namespace will be repointed from its process-local metrics store to two protected procedures backed by the repository.

| Procedure | Input | Output | Boundary |
|---|---|---|---|
| `analytics.getExecutionHistory` | Optional owned `serverId`, operation, success state, bounded page size, and offset | Sanitized activity records plus `hasMore` | Authenticated workspace only; records are newest first. |
| `analytics.getReport` | `7d` or `30d` time range and optional owned `serverId` | Real totals, success rate, average duration, operation breakdown, top tools, and active servers | Aggregates only the matching workspace log rows; returns zeroes and empty collections when there is no activity. |

The legacy `recordExecution`, arbitrary date-range reports, in-memory error trends, and process-local state will be removed. Runtime operations already record their own outcome after authorization; the client must never manufacture an execution record.

## Public Record Shape

```ts
type PublicMcpExecution = {
  id: string;
  serverId: string;
  serverName: string;
  operation: "discover" | "execute" | "test";
  toolName?: string;
  success: boolean;
  durationMs: number;
  errorMessage?: string;
  createdAt: Date;
};
```

The response deliberately excludes endpoint URLs as well as request headers, credentials, raw tool arguments, and raw tool results. A history page needs a readable audit event, not the keys to the kingdom.

## Mobile Route Behavior

The execution-history route will display loading, empty, error, and paginated activity states. It will provide only supported filters: activity outcome and operation. The analytics route will render metrics only from `analytics.getReport`; an empty workspace shows zero verified activity and explanatory copy rather than placeholder cards. Both routes explain the selected scope and date window.

## Regression Requirements

The implementation must prove that protected procedures are used, all repository reads include the active workspace predicate, no legacy `ExecutionAnalytics` store remains reachable, and public responses omit credentials, endpoints, payloads, and result data. Unit tests must validate arithmetic against known record fixtures and must preserve a genuine empty-report result.
