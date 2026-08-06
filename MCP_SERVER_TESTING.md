# MCP Server Testing Infrastructure

Complete testing infrastructure for validating MCP Hub against real MCP servers.

## Setup: Claude's Official MCP Servers

### 1. Filesystem MCP Server

**Installation:**
```bash
npm install -g @modelcontextprotocol/server-filesystem
```

**Start Server (HTTP):**
```bash
mcp-server-filesystem --port 3001 --host 127.0.0.1
```

**Start Server (WebSocket):**
```bash
mcp-server-filesystem --port 3002 --transport websocket --host 127.0.0.1
```

**Available Tools:**
- `read_file` - Read file contents
- `write_file` - Write to file
- `list_files` - List directory contents
- `delete_file` - Delete file
- `create_directory` - Create directory

### 2. Web MCP Server

**Installation:**
```bash
npm install -g @modelcontextprotocol/server-web
```

**Start Server (HTTP):**
```bash
mcp-server-web --port 3003 --host 127.0.0.1
```

**Available Tools:**
- `fetch` - Fetch URL content
- `search` - Search the web

---

## Test Scenarios

### Test 1: Server Connection

**Objective:** Verify connection to MCP server

**Steps:**
1. Open MCP Hub app
2. Navigate to "Connect" tab
3. Enter server details:
   - Host: `127.0.0.1`
   - Port: `3001`
   - Transport: `HTTP`
4. Tap "Connect"

**Expected Result:**
- Connection status shows "Connected"
- No error messages
- Connection time < 2 seconds

**Failure Modes to Check:**
- Server unreachable
- Invalid host/port
- Connection timeout
- Network error

---

### Test 2: Tool Discovery

**Objective:** Verify tool discovery from server

**Steps:**
1. Connect to filesystem server (Test 1)
2. Navigate to "Tools" tab
3. Tap "Discover Tools"

**Expected Result:**
- Tool list loads within 2 seconds
- Shows all filesystem tools (read_file, write_file, etc.)
- Each tool shows description and parameters
- No duplicate tools
- Tools are searchable

**Failure Modes to Check:**
- Discovery timeout
- Empty tool list
- Malformed tool schemas
- Missing tool descriptions

---

### Test 3: Tool Execution - Simple Parameter

**Objective:** Execute tool with simple string parameter

**Steps:**
1. Connect to filesystem server
2. Discover tools
3. Select `list_files` tool
4. Enter path: `/tmp`
5. Tap "Execute"

**Expected Result:**
- Execution completes within 5 seconds
- Shows file list in result
- Result displays in readable format
- Execution time shown

**Failure Modes to Check:**
- Invalid path handling
- Permission denied
- Timeout on large directories
- Malformed result

---

### Test 4: Tool Execution - File Operations

**Objective:** Execute file read/write operations

**Steps:**
1. Connect to filesystem server
2. Execute `write_file` with:
   - Path: `/tmp/test.txt`
   - Content: `Hello World`
3. Execute `read_file` with:
   - Path: `/tmp/test.txt`

**Expected Result:**
- Write succeeds
- Read returns "Hello World"
- Both complete within 5 seconds
- No data corruption

**Failure Modes to Check:**
- Write permission denied
- File not found
- Encoding issues
- Partial writes

---

### Test 5: Parameter Validation

**Objective:** Verify parameter validation

**Steps:**
1. Connect to filesystem server
2. Select `read_file` tool
3. Leave path empty
4. Tap "Execute"

**Expected Result:**
- Validation error shown before execution
- Error message: "Path is required"
- Execution blocked
- User can fix and retry

**Failure Modes to Check:**
- Missing validation
- Unclear error messages
- Execution despite validation error
- Validation too strict

---

### Test 6: Error Handling - Server Unreachable

**Objective:** Verify graceful handling when server is unreachable

**Steps:**
1. Stop filesystem server
2. Try to connect to `127.0.0.1:3001`
3. Observe error handling

**Expected Result:**
- Error message shown within 5 seconds
- Suggests checking server status
- "Retry" button available
- App doesn't crash

**Failure Modes to Check:**
- Hangs indefinitely
- Cryptic error message
- App crash
- No retry option

---

### Test 7: Timeout Handling

**Objective:** Verify handling of slow operations

**Steps:**
1. Connect to filesystem server
2. Execute `list_files` on large directory
3. Observe timeout handling

**Expected Result:**
- Operation times out after configured timeout
- User-friendly timeout message
- "Retry" option available
- App responsive

**Failure Modes to Check:**
- Hangs indefinitely
- No timeout message
- App becomes unresponsive
- Partial results not shown

---

### Test 8: Result Display Formats

**Objective:** Verify result display in multiple formats

**Steps:**
1. Execute `list_files` tool
2. In results screen, select different formats:
   - Raw Text
   - Pretty JSON
   - Table
   - Tree

**Expected Result:**
- Each format displays correctly
- No data loss in formatting
- Easy to read and understand
- Copy/share buttons work

**Failure Modes to Check:**
- Format rendering broken
- Data corruption
- Unreadable output
- Copy doesn't work

---

### Test 9: Macro Recording

**Objective:** Record execution as macro

**Steps:**
1. Execute `read_file` tool
2. Tap "Save as Macro"
3. Enter macro name: "Read Test File"
4. Tap "Save"

**Expected Result:**
- Macro saved successfully
- Appears in macro gallery
- Can be executed again
- Parameters preserved

**Failure Modes to Check:**
- Macro not saved
- Parameters lost
- Macro not executable
- Duplicate macros

---

### Test 10: Multiple Connections

**Objective:** Connect to multiple servers simultaneously

**Steps:**
1. Connect to filesystem server (port 3001)
2. Connect to web server (port 3003)
3. Switch between tabs
4. Discover tools from each

**Expected Result:**
- Both connections active
- Tools from each server available
- No cross-contamination
- Can execute from either

**Failure Modes to Check:**
- Only one connection works
- Tools mixed up
- Connection conflicts
- Performance degradation

---

## Performance Benchmarks

### Expected Performance

| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|-----------|--------------|
| Connection | < 1s | < 2s | > 5s |
| Tool Discovery | < 2s | < 3s | > 10s |
| Tool Execution | < 5s | < 10s | > 30s |
| Result Display | < 1s | < 2s | > 5s |
| Macro Execution | < 5s | < 10s | > 30s |

### Profiling

Use React Native Debugger to profile:
1. Bridge call overhead
2. JSON parsing time
3. UI rendering time
4. Memory usage

---

## Test Execution Checklist

- [ ] Filesystem server running on port 3001 (HTTP)
- [ ] Filesystem server running on port 3002 (WebSocket)
- [ ] Web server running on port 3003 (HTTP)
- [ ] App installed on real device or emulator
- [ ] Network connectivity verified
- [ ] Test 1: Server Connection
- [ ] Test 2: Tool Discovery
- [ ] Test 3: Simple Tool Execution
- [ ] Test 4: File Operations
- [ ] Test 5: Parameter Validation
- [ ] Test 6: Error Handling
- [ ] Test 7: Timeout Handling
- [ ] Test 8: Result Display
- [ ] Test 9: Macro Recording
- [ ] Test 10: Multiple Connections
- [ ] Performance benchmarks recorded
- [ ] No crashes observed
- [ ] All error messages clear
- [ ] UI responsive throughout

---

## Troubleshooting

### Server Won't Start

```bash
# Check if port is in use
lsof -i :3001

# Kill process on port
kill -9 <PID>

# Start with verbose logging
mcp-server-filesystem --port 3001 --debug
```

### Connection Refused

```bash
# Verify server is running
curl http://127.0.0.1:3001/health

# Check firewall
sudo ufw allow 3001

# Test from device
adb shell ping 127.0.0.1
```

### Tool Discovery Fails

```bash
# Test tool discovery endpoint
curl http://127.0.0.1:3001/mcp/tools/list

# Check server logs for errors
```

### Execution Timeout

```bash
# Increase timeout in app settings
# Check server performance
# Reduce data size for testing
```

---

## Automated Testing

### Test Runner Script

```bash
#!/bin/bash

# Start servers
mcp-server-filesystem --port 3001 &
FS_PID=$!

mcp-server-web --port 3003 &
WEB_PID=$!

# Wait for servers to start
sleep 2

# Run tests
npm test -- mcp-integration.test.ts

# Cleanup
kill $FS_PID $WEB_PID
```

### Integration Tests

Create `mcp-integration.test.ts` with:
- Connection tests
- Discovery tests
- Execution tests
- Error handling tests
- Performance tests

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: MCP Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm install -g @modelcontextprotocol/server-filesystem
      - run: npm test -- mcp-integration.test.ts
```

---

## Success Criteria

All tests must pass with:
- ✅ No crashes
- ✅ All operations complete within acceptable time
- ✅ Error messages clear and actionable
- ✅ Results display correctly
- ✅ Macros record and execute properly
- ✅ Multiple connections work simultaneously
- ✅ Performance meets benchmarks
