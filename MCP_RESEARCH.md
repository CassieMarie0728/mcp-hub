# MCP Hub - Protocol Research & Architecture

## Model Context Protocol (MCP) Overview

The Model Context Protocol is an open protocol that enables seamless integration between LLM applications and external data sources and tools. MCP uses JSON-RPC 2.0 messages to establish communication between hosts, clients, and servers.

## Key Architecture Concepts

### Participants

The MCP architecture consists of three main participants:

1. **MCP Host**: The application (in our case, the mobile app) that coordinates and manages MCP clients
2. **MCP Client**: A component that maintains a connection to an MCP server and obtains context/capabilities
3. **MCP Server**: A program that provides context, tools, resources, and prompts to MCP clients

For our mobile app, the app itself acts as the MCP Host, creating one MCP Client for each connected MCP Server.

### Two-Layer Architecture

MCP consists of two layers:

**Data Layer**: Implements JSON-RPC 2.0 based exchange protocol including:
- Lifecycle management (connection initialization, capability negotiation, termination)
- Server features (tools, resources, prompts)
- Client features (sampling, elicitation, logging)
- Utility features (notifications, progress tracking)

**Transport Layer**: Manages communication channels and authentication:
- **Stdio transport**: Uses standard input/output for direct process communication (local servers)
- **Streamable HTTP transport**: Uses HTTP POST for messages with optional Server-Sent Events (remote servers)

## Core Primitives

Servers can expose three core primitives:

1. **Tools**: Executable functions that can be invoked to perform actions
   - Discovered via `tools/list` request
   - Executed via `tools/call` request
   - Each tool has a name, description, and inputSchema (JSON Schema)
   - Results can be text, images, audio, or resource links

2. **Resources**: Data sources that provide contextual information
   - Discovered via `resources/list` request
   - Retrieved via `resources/read` request
   - Can be embedded or linked

3. **Prompts**: Reusable templates for structuring interactions
   - Discovered via `prompts/list` request
   - Retrieved via `prompts/get` request

## Tool Discovery & Execution Flow

### Tool Discovery

```
Client Request:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "cursor": "optional-cursor-value"  // for pagination
  }
}

Server Response:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "tool_name",
        "title": "Human-readable title",
        "description": "What this tool does",
        "inputSchema": {
          "type": "object",
          "properties": { ... },
          "required": ["field1", "field2"]
        }
      }
    ],
    "nextCursor": "next-page-cursor"
  }
}
```

### Tool Execution

```
Client Request:
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "field1": "value1",
      "field2": "value2"
    }
  }
}

Server Response:
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Tool result text"
      }
    ],
    "isError": false
  }
}
```

## Tool Result Content Types

Tools can return various content types:

- **Text Content**: Plain text results
- **Image Content**: Base64-encoded images with MIME type
- **Audio Content**: Base64-encoded audio with MIME type
- **Resource Links**: URIs pointing to additional resources
- **Embedded Resources**: Full resource data embedded in response
- **Structured Content**: JSON objects conforming to optional output schema

## Connection Lifecycle

1. **Initialize**: Client sends initialization request with capabilities
2. **Negotiate**: Server responds with its capabilities
3. **Ready**: Both sides are ready for communication
4. **Discovery**: Client discovers available tools/resources/prompts
5. **Execution**: Client calls tools, server responds
6. **Termination**: Connection is closed

## Security & Trust Considerations

Key principles for our mobile app:

1. **User Consent & Control**: Users must explicitly consent to data access and tool execution
2. **Data Privacy**: Explicit consent required before exposing user data to servers
3. **Tool Safety**: Tools represent arbitrary code execution and must be treated with caution
4. **Clear Authorization**: Users should understand what each tool does before execution

## Implementation Strategy for Mobile App

### Phase 1: Core Connection Management
- Implement MCP client for connecting to servers
- Support stdio transport (for local servers)
- Support HTTP transport (for remote servers)
- Handle connection lifecycle (init, negotiate, ready, close)

### Phase 2: Tool Discovery
- Implement `tools/list` request handling
- Parse tool schemas from server responses
- Store tool metadata locally
- Display tools in UI with descriptions and parameters

### Phase 3: Tool Execution
- Build dynamic parameter input forms from JSON schemas
- Implement `tools/call` request handling
- Display results in formatted view
- Handle errors gracefully

### Phase 4: Advanced Features
- Support pagination for large tool lists
- Handle streaming responses
- Implement tool execution history
- Support resources and prompts discovery

## JSON-RPC 2.0 Message Format

All MCP messages follow JSON-RPC 2.0 format:

```
Request:
{
  "jsonrpc": "2.0",
  "id": <unique-id>,
  "method": "<method-name>",
  "params": { ... }
}

Response:
{
  "jsonrpc": "2.0",
  "id": <same-id>,
  "result": { ... }  // or "error": { "code": ..., "message": ... }
}

Notification (no response expected):
{
  "jsonrpc": "2.0",
  "method": "<method-name>",
  "params": { ... }
}
```

## References

- Official MCP Specification: https://modelcontextprotocol.io/specification/2025-11-25
- MCP Architecture: https://modelcontextprotocol.io/docs/learn/architecture
- MCP Tools: https://modelcontextprotocol.io/docs/concepts/tools
- MCP SDKs: https://modelcontextprotocol.io/docs/sdk
