# Real Device Testing Guide

This guide covers setting up and testing MCP Hub on real Android devices and emulators with Claude's official MCP servers.

## Prerequisites

- Android device or emulator with Expo Go installed
- Node.js and npm installed
- MCP servers running locally (filesystem, web, git)
- Network connectivity between device and development machine

## Device Setup

### Android Emulator Setup

1. **Start Android Emulator:**
   ```bash
   emulator -avd Pixel_6_API_31 -netdelay none -netspeed full
   ```

2. **Configure Network Access:**
   - Emulator uses `10.0.2.2` to access host machine's localhost
   - Update server connection to use `10.0.2.2` instead of `localhost`

3. **Verify Connectivity:**
   ```bash
   adb shell ping 10.0.2.2
   ```

### Physical Device Setup

1. **Connect Device:**
   - Enable USB debugging on device
   - Connect via USB or WiFi
   - Verify connection: `adb devices`

2. **Configure Network:**
   - Device and development machine must be on same network
   - Use device's local IP address for server connections
   - Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

3. **Install Expo Go:**
   - Download from Google Play Store
   - Open app and scan QR code from Metro bundler

## MCP Server Setup

### Start Claude Filesystem MCP Server

```bash
# Install if not already installed
npm install -g @claude/mcp-filesystem

# Start server on port 3001
mcp-filesystem --port 3001
```

### Start Claude Web MCP Server

```bash
# Install if not already installed
npm install -g @claude/mcp-web

# Start server on port 3002
mcp-web --port 3002
```

### Start Claude Git MCP Server

```bash
# Install if not already installed
npm install -g @claude/mcp-git

# Start server on port 3003
mcp-git --port 3003
```

## Metro Bundler

1. **Start Development Server:**
   ```bash
   cd /home/ubuntu/mcp-hub
   npm run dev
   ```

2. **Get Connection URL:**
   - Metro will output connection URL
   - For emulator: Use the URL as-is
   - For physical device: Scan QR code or use ngrok tunnel

3. **Open in Expo Go:**
   - Emulator: Automatically opens
   - Device: Scan QR code from Metro output

## Test Scenarios

### Scenario 1: Connect to Filesystem Server

**Objective:** Test basic server connection with filesystem MCP

**Steps:**
1. Open MCP Hub app
2. Go to "Connect" tab
3. Enter server details:
   - Host: `10.0.2.2` (emulator) or device IP (physical)
   - Port: `3001`
   - Transport: HTTP
4. Click "Connect"
5. Verify connection status shows "Connected"

**Expected Results:**
- Connection established without errors
- Status indicator shows green/connected
- No timeout errors
- Connection persists for 30+ seconds

### Scenario 2: Tool Discovery

**Objective:** Test discovering tools from connected server

**Steps:**
1. From "Connect" tab, select connected filesystem server
2. Go to "Tools" tab
3. Verify tools list loads
4. Search for "read_file" tool
5. Tap on tool to view details

**Expected Results:**
- Tools list loads in < 2 seconds
- Shows 10+ filesystem tools
- Tool details display correctly
- Schema information is readable
- No crashes or errors

### Scenario 3: Tool Execution - Simple Parameter

**Objective:** Test executing tool with simple string parameter

**Steps:**
1. From Tools tab, select "list_directory" tool
2. Go to "Execute" tab
3. Enter path parameter: `/tmp`
4. Click "Execute"
5. Wait for results
6. View results in default format

**Expected Results:**
- Form validates input
- Execution completes in < 5 seconds
- Results display successfully
- Shows directory listing
- No parameter validation errors

### Scenario 4: Tool Execution - Complex Parameter

**Objective:** Test executing tool with file path and options

**Steps:**
1. Select "read_file" tool
2. Enter file path: `/etc/hosts`
3. Click "Execute"
4. View results in Text format
5. Switch to JSON format
6. Switch to Code Block format

**Expected Results:**
- All parameter types work correctly
- File contents display properly
- Format switching works smoothly
- No crashes during format changes
- Results are readable in all formats

### Scenario 5: File Picker Integration

**Objective:** Test file picker for file parameters

**Steps:**
1. Select "read_file" tool
2. Tap file picker icon
3. Browse to a file
4. Select file
5. Verify path is populated
6. Execute tool

**Expected Results:**
- File picker opens correctly
- File selection works
- Path is correctly populated
- Tool executes with selected file
- Results display file contents

### Scenario 6: Error Handling - Invalid Path

**Objective:** Test error handling for invalid parameters

**Steps:**
1. Select "read_file" tool
2. Enter invalid path: `/nonexistent/file/path`
3. Click "Execute"
4. Observe error message

**Expected Results:**
- Error message displays clearly
- Error indicates "File not found"
- User can retry with different path
- App doesn't crash
- Connection remains active

### Scenario 7: Error Handling - Server Unreachable

**Objective:** Test error handling when server is unreachable

**Steps:**
1. Stop MCP server (Ctrl+C)
2. Try to execute a tool
3. Observe timeout/connection error
4. Click "Retry"
5. Restart MCP server
6. Click "Retry" again

**Expected Results:**
- Connection error displays clearly
- Retry button appears
- Retry succeeds after server restarts
- No app crashes
- Connection recovers properly

### Scenario 8: Execution History

**Objective:** Test execution history tracking

**Steps:**
1. Execute 3-5 tools successfully
2. Go to "History" tab
3. Verify all executions are listed
4. Search for specific tool
5. Filter by status
6. Click on execution to view details

**Expected Results:**
- All executions are recorded
- Search/filter works correctly
- Execution details display properly
- Timestamps are accurate
- Can retry from history

### Scenario 9: Server Presets

**Objective:** Test server preset management

**Steps:**
1. Go to "Presets" tab
2. Create new preset with filesystem server details
3. Name it "My Filesystem"
4. Mark as favorite
5. Go to Connect tab
6. Select preset to quick-connect

**Expected Results:**
- Preset creation works
- Preset is saved and listed
- Favorite marking works
- Quick-connect populates all fields
- Connection succeeds with preset

### Scenario 10: Performance - Large Tool List

**Objective:** Test performance with 100+ tools

**Steps:**
1. Generate test data with 100+ tools
2. Connect to test server
3. Go to Tools tab
4. Measure load time
5. Scroll through list
6. Search for tools
7. Measure response time

**Expected Results:**
- Initial load completes in < 3 seconds
- Scrolling is smooth (60 FPS)
- Search responds in < 500ms
- No stuttering or lag
- Memory usage stays reasonable

## Performance Metrics

Record the following metrics for each test:

| Metric | Expected | Actual | Notes |
|--------|----------|--------|-------|
| Connection time | < 2s | | |
| Tool discovery time | < 2s | | |
| Tool execution time | < 5s | | |
| Results display time | < 1s | | |
| Format switch time | < 500ms | | |
| List scroll FPS | 60 FPS | | |
| Search response | < 500ms | | |
| Memory usage | < 100MB | | |

## Troubleshooting

### Connection Refused

**Problem:** Cannot connect to MCP server

**Solutions:**
1. Verify server is running: `netstat -an | grep 3001`
2. Check firewall settings
3. Verify correct host/port in app
4. For emulator, use `10.0.2.2` not `localhost`
5. For physical device, use device's local IP

### Timeout Errors

**Problem:** Tool execution times out

**Solutions:**
1. Increase timeout in server preset (default 30s)
2. Check network connectivity
3. Verify server is responsive: `curl http://host:port/health`
4. Check server logs for errors
5. Try simpler tool first

### Tool Discovery Empty

**Problem:** No tools appear after connecting

**Solutions:**
1. Verify server supports tools/list endpoint
2. Check server logs for errors
3. Try reconnecting
4. Verify server is actually running
5. Check network connectivity

### File Picker Not Working

**Problem:** File picker doesn't open or select files

**Solutions:**
1. Verify app has file permissions
2. Check Android permissions: Settings > Apps > MCP Hub > Permissions
3. Try different file location
4. Restart app
5. Check device storage

### Performance Issues

**Problem:** App is slow or laggy

**Solutions:**
1. Profile with React DevTools
2. Check for large result sets
3. Reduce tool list size
4. Enable FlatList virtualization
5. Check device memory usage

## Test Results Template

```markdown
# Test Results - [Date]

## Device Info
- Device: [Emulator/Physical]
- OS: Android [Version]
- App Version: [Version]

## Server Configuration
- Filesystem Server: [Host:Port]
- Web Server: [Host:Port]
- Git Server: [Host:Port]

## Test Results

### Scenario 1: Connect to Filesystem Server
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Scenario 2: Tool Discovery
- Status: [PASS/FAIL]
- Load Time: [Time]
- Tool Count: [Number]
- Notes: [Any issues or observations]

### Scenario 3: Simple Tool Execution
- Status: [PASS/FAIL]
- Execution Time: [Time]
- Notes: [Any issues or observations]

### Scenario 4: Complex Tool Execution
- Status: [PASS/FAIL]
- Execution Time: [Time]
- Format Switch Time: [Time]
- Notes: [Any issues or observations]

### Scenario 5: File Picker
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Scenario 6: Error Handling
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Scenario 7: Server Unreachable
- Status: [PASS/FAIL]
- Recovery Time: [Time]
- Notes: [Any issues or observations]

### Scenario 8: Execution History
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Scenario 9: Server Presets
- Status: [PASS/FAIL]
- Notes: [Any issues or observations]

### Scenario 10: Performance
- Status: [PASS/FAIL]
- Load Time: [Time]
- Scroll FPS: [FPS]
- Search Response: [Time]
- Memory Usage: [MB]
- Notes: [Any issues or observations]

## Overall Summary
- Total Tests: 10
- Passed: [Number]
- Failed: [Number]
- Pass Rate: [Percentage]

## Issues Found
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]
```

## Next Steps

After completing all test scenarios:

1. Document any bugs or issues found
2. Record performance metrics
3. Identify optimization opportunities
4. Plan fixes for any failures
5. Prepare for production release
