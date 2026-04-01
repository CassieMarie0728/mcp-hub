# MCP Hub MVP Architecture: Server Connection → Tool Discovery → Execution → Results

## Overview

This document defines the robust architecture for the core MVP functionality: connecting to MCP servers, discovering tools, executing them, and displaying results. The system is designed to handle both simple and complex scenarios with graceful error handling.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native UI Layer                     │
├─────────────────────────────────────────────────────────────┤
│  • Server Connection UI                                      │
│  • Tool Discovery & Listing                                  │
│  • Tool Execution Form Builder (dynamic schema)              │
│  • Results Display (user-selectable format)                  │
│  • Error Handling & Recovery UI                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              React Native Bridge Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • MCPServerBridge.ts (TypeScript hooks)                     │
│  • Connection state management                               │
│  • Tool caching & synchronization                            │
│  • Execution state tracking                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│            Kotlin Native Bridge Layer                        │
├─────────────────────────────────────────────────────────────┤
│  • MCPServerBridgeExtended.kt                                │
│  • connectToServer(host, port, transport)                    │
│  • discoverTools(serverId)                                   │
│  • executeTool(serverId, toolName, params)                   │
│  • Connection pooling & lifecycle management                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│           Kotlin MCP Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│  • MCPClientManager.kt (connection pooling)                  │
│  • TransportFactory.kt (HTTP, WebSocket, Stdio)              │
│  • ToolDiscoveryEngine.kt (schema parsing)                   │
│  • ToolExecutionEngine.kt (parameter validation)             │
│  • ErrorRecoveryManager.kt (retry logic, timeouts)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              External MCP Servers                            │
├─────────────────────────────────────────────────────────────┤
│  • HTTP/HTTPS servers                                        │
│  • WebSocket servers                                         │
│  • Stdio processes                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Data Models

### 2.1 Server Connection

```kotlin
data class MCPServerConnection(
    val id: String,                    // Unique identifier
    val name: String,                  // User-friendly name
    val host: String,                  // Hostname or IP
    val port: Int,                     // Port number
    val transport: TransportType,      // HTTP, WebSocket, Stdio
    val isSecure: Boolean,             // HTTPS/WSS
    val authToken: String?,            // Optional bearer token
    val connectionTimeout: Long = 30000, // 30 seconds
    val readTimeout: Long = 60000,     // 60 seconds
    val status: ConnectionStatus = ConnectionStatus.DISCONNECTED,
    val lastConnectedAt: Long? = null,
    val errorMessage: String? = null
)

enum class TransportType {
    HTTP, WEBSOCKET, STDIO
}

enum class ConnectionStatus {
    DISCONNECTED, CONNECTING, CONNECTED, ERROR, TIMEOUT
}
```

### 2.2 Tool Schema

```kotlin
data class ToolSchema(
    val name: String,
    val description: String,
    val inputSchema: JsonSchema,  // JSON Schema for parameters
    val category: String? = null,
    val tags: List<String> = emptyList()
)

data class JsonSchema(
    val type: String,              // "object", "string", "number", etc.
    val properties: Map<String, JsonSchema>? = null,
    val required: List<String>? = null,
    val items: JsonSchema? = null, // For arrays
    val enum: List<String>? = null,
    val description: String? = null,
    val default: Any? = null,
    val minimum: Number? = null,
    val maximum: Number? = null,
    val minLength: Int? = null,
    val maxLength: Int? = null,
    val pattern: String? = null,
    val format: String? = null     // "date", "time", "uri", "email", etc.
)
```

### 2.3 Tool Execution

```kotlin
data class ToolExecutionRequest(
    val serverId: String,
    val toolName: String,
    val parameters: Map<String, Any?>,
    val timeoutMs: Long = 60000,
    val retryCount: Int = 3
)

data class ToolExecutionResult(
    val success: Boolean,
    val result: Any?,              // Tool output (can be any type)
    val resultType: ResultType,    // Inferred type for display
    val executionTimeMs: Long,
    val error: ExecutionError? = null,
    val timestamp: Long = System.currentTimeMillis()
)

enum class ResultType {
    TEXT, JSON, MARKDOWN, HTML, IMAGE, BINARY, STREAM, MIXED
}

data class ExecutionError(
    val code: String,              // "TIMEOUT", "INVALID_PARAMS", etc.
    val message: String,
    val details: String? = null,
    val recoveryAction: RecoveryAction? = null
)

enum class RecoveryAction {
    RETRY, RECONNECT, VALIDATE_PARAMS, INCREASE_TIMEOUT, MANUAL_INTERVENTION
}
```

### 2.4 Result Display Options

```kotlin
enum class ResultDisplayFormat {
    RAW_TEXT,           // Plain text output
    PRETTY_JSON,        // Formatted JSON
    MARKDOWN,           // Rendered markdown
    HTML,               // Rendered HTML
    TABLE,              // Tabular format (if applicable)
    TREE,               // Tree view (for nested objects)
    CODE_BLOCK,         // Code syntax highlighting
    IMAGE,              // Image rendering
    DOWNLOAD            // Download as file
}
```

---

## 3. Core Flows

### 3.1 Server Connection Flow

```
User Input (host, port, transport, auth)
    ↓
Validate Input (host format, port range, etc.)
    ↓
Create MCPServerConnection object
    ↓
Call Kotlin: connectToServer(connection)
    ↓
[Kotlin] TransportFactory creates appropriate transport
    ↓
[Kotlin] Attempt connection with timeout
    ↓
[Kotlin] On success: Store connection, emit CONNECTED status
    ↓
[Kotlin] On failure: Emit ERROR status with message
    ↓
React Native receives status update
    ↓
UI updates with connection result
```

**Error Handling:**
- Network unreachable → Show "Check your internet connection"
- Connection timeout → Show "Server not responding (30s timeout)"
- Invalid host → Show "Invalid hostname or IP address"
- Port unreachable → Show "Port not open or firewall blocking"
- Auth failed → Show "Invalid authentication token"

### 3.2 Tool Discovery Flow

```
User taps "Discover Tools" on connected server
    ↓
Call Kotlin: discoverTools(serverId)
    ↓
[Kotlin] Retrieve MCPServerConnection from cache
    ↓
[Kotlin] Send tools/list request via appropriate transport
    ↓
[Kotlin] Parse JSON-RPC response
    ↓
[Kotlin] Validate each tool schema
    ↓
[Kotlin] Cache tool schemas locally
    ↓
[Kotlin] Return ToolSchema[] to React Native
    ↓
React Native stores tools in state
    ↓
UI displays tool list with search/filter
```

**Error Handling:**
- Server disconnected → Attempt reconnect, show "Reconnecting..."
- Invalid response → Show "Server returned invalid tool list"
- No tools found → Show "No tools available on this server"
- Timeout → Show "Tool discovery timeout (60s)"

### 3.3 Tool Execution Flow

```
User fills out tool parameters in dynamic form
    ↓
Validate parameters against JSON schema
    ↓
Show confirmation dialog with parameters
    ↓
User confirms execution
    ↓
Call Kotlin: executeTool(serverId, toolName, parameters)
    ↓
[Kotlin] Validate parameters again (server-side validation)
    ↓
[Kotlin] Send tools/call request via transport
    ↓
[Kotlin] Handle streaming responses (if applicable)
    ↓
[Kotlin] Collect result with timeout protection
    ↓
[Kotlin] Return ToolExecutionResult to React Native
    ↓
React Native receives result
    ↓
UI shows result with format selection dropdown
    ↓
User selects display format
    ↓
UI renders result in selected format
```

**Error Handling:**
- Invalid parameters → Show validation errors, prevent submission
- Timeout during execution → Show "Tool execution timeout (60s)"
- Server error → Show error message from server
- Network interrupted → Show "Connection lost during execution"
- Partial result → Show what we received + error message

### 3.4 Results Display Flow

```
Tool execution completes
    ↓
Analyze result type (JSON, text, binary, etc.)
    ↓
Show format selection UI with available options:
  • Raw Text (always available)
  • Pretty JSON (if JSON)
  • Markdown (if markdown)
  • HTML (if HTML)
  • Table (if array of objects)
  • Tree (if nested object)
  • Code Block (if code)
  • Image (if image data)
  • Download (always available)
    ↓
User selects format
    ↓
UI renders result in selected format
    ↓
User can:
  • Copy to clipboard
  • Share result
  • Download result
  • View raw JSON
  • Retry execution
```

---

## 4. Kotlin Implementation Details

### 4.1 MCPClientManager.kt (Connection Pooling)

**Responsibilities:**
- Maintain connection pool for each server
- Handle connection lifecycle (create, reuse, close)
- Implement connection timeout & retry logic
- Emit connection status events to React Native

**Key Methods:**
```kotlin
fun getOrCreateConnection(config: MCPServerConnection): MCPClient
fun closeConnection(serverId: String)
fun isConnected(serverId: String): Boolean
fun getConnectionStatus(serverId: String): ConnectionStatus
fun reconnect(serverId: String)
```

### 4.2 ToolDiscoveryEngine.kt

**Responsibilities:**
- Send tools/list request to server
- Parse and validate tool schemas
- Cache schemas locally
- Handle schema versioning

**Key Methods:**
```kotlin
suspend fun discoverTools(serverId: String): List<ToolSchema>
fun getCachedTools(serverId: String): List<ToolSchema>?
fun validateToolSchema(schema: ToolSchema): Boolean
fun clearCache(serverId: String)
```

### 4.3 ToolExecutionEngine.kt

**Responsibilities:**
- Validate parameters against schema
- Send tools/call request
- Handle streaming responses
- Collect and format results
- Implement timeout protection

**Key Methods:**
```kotlin
suspend fun executeToolWithValidation(
    request: ToolExecutionRequest
): ToolExecutionResult

fun validateParameters(
    schema: ToolSchema,
    parameters: Map<String, Any?>
): ValidationResult

private fun inferResultType(result: Any?): ResultType
```

### 4.4 ErrorRecoveryManager.kt

**Responsibilities:**
- Implement retry logic with exponential backoff
- Handle specific error types
- Suggest recovery actions
- Track error metrics

**Key Methods:**
```kotlin
suspend fun <T> executeWithRetry(
    operation: suspend () -> T,
    maxRetries: Int = 3
): Result<T>

fun getRecoveryAction(error: Throwable): RecoveryAction
fun shouldRetry(error: Throwable): Boolean
```

---

## 5. React Native Implementation Details

### 5.1 useMCPServerConnection.ts Hook

**Responsibilities:**
- Manage server connection state
- Handle connection lifecycle
- Emit connection status updates
- Provide connection methods to UI

**Key Methods:**
```typescript
const {
  servers,
  activeServer,
  connectionStatus,
  connectToServer,
  disconnectServer,
  reconnectServer,
  isLoading,
  error
} = useMCPServerConnection()
```

### 5.2 useToolDiscovery.ts Hook

**Responsibilities:**
- Fetch tools from connected server
- Cache tools locally
- Provide search/filter
- Handle discovery errors

**Key Methods:**
```typescript
const {
  tools,
  filteredTools,
  searchQuery,
  setSearchQuery,
  refetchTools,
  isLoading,
  error
} = useToolDiscovery(serverId)
```

### 5.3 useToolExecution.ts Hook

**Responsibilities:**
- Manage tool execution state
- Validate parameters
- Execute tools
- Track execution history

**Key Methods:**
```typescript
const {
  execute,
  result,
  isExecuting,
  error,
  executionTime,
  history
} = useToolExecution()
```

### 5.4 ResultDisplayFormatter.ts

**Responsibilities:**
- Detect result type
- Format result for display
- Handle all display formats
- Provide copy/download functionality

**Key Methods:**
```typescript
function formatResult(
  result: any,
  format: ResultDisplayFormat
): FormattedResult

function detectResultType(result: any): ResultType

function renderResult(
  result: any,
  format: ResultDisplayFormat
): ReactNode
```

---

## 6. Error Handling Strategy

### 6.1 Error Categories

| Error Type | Cause | User Message | Recovery |
|-----------|-------|--------------|----------|
| UNREACHABLE | Network down, host not found | "Server not reachable. Check your internet connection." | Retry, check network |
| TIMEOUT | Server slow or unresponsive | "Request timed out (60s). Server may be slow." | Retry, increase timeout |
| INVALID_PARAMS | User provided bad parameters | "Invalid parameter: {field}. {validation error}" | Fix parameters, retry |
| AUTH_FAILED | Invalid token or credentials | "Authentication failed. Check your token." | Update token, reconnect |
| INVALID_RESPONSE | Server returned malformed data | "Server returned invalid response." | Reconnect, contact server admin |
| TOOL_ERROR | Tool execution failed | "Tool error: {server error message}" | Check parameters, retry |
| PARTIAL_RESULT | Some data received before timeout | "Partial result received (timeout after 60s)." | View partial result, retry |

### 6.2 Retry Strategy

- **Automatic retry:** Network errors, timeouts (exponential backoff: 500ms, 1s, 2s)
- **Manual retry:** User-initiated via UI button
- **Reconnect:** Connection lost during execution
- **Max retries:** 3 attempts before giving up

### 6.3 User Feedback

- Loading states during connection/discovery/execution
- Progress indicators for long operations
- Inline validation errors in forms
- Toast notifications for quick feedback
- Detailed error dialogs for complex errors
- Recovery suggestions in error messages

---

## 7. Success Criteria

✅ User can connect to any MCP server (HTTP, WebSocket, Stdio)
✅ User can discover all tools on a connected server
✅ User can execute any tool with simple or complex parameters
✅ User can see results in multiple formats
✅ All error scenarios handled gracefully
✅ Connection recovery works automatically
✅ Performance is smooth (no UI freezes)
✅ Works with real MCP servers (Claude's, custom, etc.)
✅ Comprehensive error messages guide users to solutions
✅ No crashes or unhandled exceptions
