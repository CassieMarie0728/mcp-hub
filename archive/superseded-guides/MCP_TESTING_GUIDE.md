# MCP Hub Testing Guide

## Real MCP Server Testing

This guide walks you through testing MCP Hub with real MCP servers from Anthropic.

---

## Prerequisites

1. **Node.js** (v18+) installed
2. **npm** or **yarn** package manager
3. **MCP Hub app** running on Android device or emulator
4. **Terminal/Command line** access

---

## Part 1: Setting Up Claude's Official MCP Servers

### 1.1 Filesystem MCP Server

The Filesystem MCP server provides file operations (read, write, list, etc.).

**Installation:**

```bash
# Create a directory for MCP servers
mkdir ~/mcp-servers
cd ~/mcp-servers

# Install filesystem MCP
npm install @modelcontextprotocol/server-filesystem
```

**Starting the server:**

```bash
# Terminal 1: Start filesystem MCP on port 3001
npx @modelcontextprotocol/server-filesystem /tmp/mcp-test

# You should see output like:
# Server listening on port 3001
```

**Configuration in MCP Hub:**

1. Open MCP Hub app
2. Go to **Presets** tab
3. Tap **Use Template**
4. Select **Claude Filesystem MCP**
5. Verify settings:
   - Host: `localhost`
   - Port: `3001`
   - Transport: `HTTP`
6. Tap **Create Preset**

---

### 1.2 Web MCP Server

The Web MCP server provides web browsing capabilities.

**Installation:**

```bash
# Install web MCP
npm install @modelcontextprotocol/server-web
```

**Starting the server:**

```bash
# Terminal 2: Start web MCP on port 3002
npx @modelcontextprotocol/server-web

# You should see output like:
# Server listening on port 3002
```

**Configuration in MCP Hub:**

1. Go to **Presets** tab
2. Tap **Use Template**
3. Select **Claude Web MCP**
4. Verify settings:
   - Host: `localhost`
   - Port: `3002`
   - Transport: `HTTP`
5. Tap **Create Preset**

---

## Part 2: Testing the Complete Flow

### Test 1: Server Connection

**Steps:**

1. Open MCP Hub
2. Go to **Connect** tab
3. Select a preset from **Recently Used** or **Favorites**
4. Tap **Connect**
5. **Expected Result:** Status shows "Connected" ✅

**Troubleshooting:**

- If connection fails, verify the MCP server is running
- Check that host and port are correct
- Ensure your device/emulator can reach `localhost`

---

### Test 2: Tool Discovery

**Steps:**

1. After connecting to a server, go to **Tools** tab
2. You should see a list of available tools
3. For Filesystem MCP, you should see:
   - `list_directory`
   - `read_file`
   - `write_file`
   - `create_directory`
   - `delete_file`
   - `move_file`
4. Tap on a tool to see its parameters

**Expected Result:** Tools load and display correctly ✅

**Troubleshooting:**

- If no tools appear, verify the connection is active
- Check that the server is running
- Try refreshing the tool list

---

### Test 3: Tool Execution (Filesystem)

**Test Case 3a: List Directory**

1. Go to **Execute** tab
2. Select tool: `list_directory`
3. Enter parameter: `/tmp/mcp-test` (or any accessible directory)
4. Tap **Execute**
5. **Expected Result:** Directory contents display as a table ✅

**Test Case 3b: Read File**

1. Create a test file first:
   ```bash
   echo "Hello from MCP!" > /tmp/mcp-test/test.txt
   ```

2. In MCP Hub, select tool: `read_file`
3. Enter parameter: `/tmp/mcp-test/test.txt`
4. Tap **Execute**
5. **Expected Result:** File contents display as text ✅

**Test Case 3c: Write File**

1. Select tool: `write_file`
2. Enter parameters:
   - `path`: `/tmp/mcp-test/output.txt`
   - `contents`: `Test content from MCP Hub`
3. Tap **Execute**
4. **Expected Result:** File is created ✅
5. Verify by reading the file:
   ```bash
   cat /tmp/mcp-test/output.txt
   ```

---

### Test 4: Result Display Formats

**Steps:**

1. Execute a tool that returns JSON data
2. In **Results** tab, tap format selector
3. Try each format:
   - **Text**: Plain text rendering
   - **JSON**: Pretty-printed JSON
   - **Markdown**: Rendered markdown
   - **Table**: Tabular format (for arrays)
   - **Code Block**: Syntax-highlighted code
   - **Tree**: Hierarchical structure

**Expected Result:** All formats render correctly ✅

---

### Test 5: Execution History

**Steps:**

1. Execute several tools
2. Go to **History** tab
3. You should see all past executions listed
4. Filter by status (Success, Failed, Timeout)
5. Search by tool name or server
6. Tap **Retry** to re-execute a tool
7. Tap **Delete** to remove an execution

**Expected Result:** History tracks all executions ✅

---

### Test 6: Server Presets

**Steps:**

1. Go to **Presets** tab
2. You should see presets you created
3. Tap ⭐ to favorite a preset
4. Tap **Connect** to quickly connect to a preset
5. Verify usage count increases

**Expected Result:** Presets work as shortcuts ✅

---

## Part 3: Error Scenarios

### Test 7: Connection Timeout

**Steps:**

1. Try to connect to a non-existent server (e.g., port 9999)
2. Wait for timeout (should be ~30 seconds)
3. **Expected Result:** Error message displays ✅

---

### Test 8: Invalid Parameters

**Steps:**

1. Execute `read_file` with invalid path: `/nonexistent/file.txt`
2. **Expected Result:** Error message displays with details ✅

---

### Test 9: Server Unreachable

**Steps:**

1. Stop the MCP server
2. Try to execute a tool
3. **Expected Result:** Connection error with recovery suggestion ✅

---

## Part 4: Performance Testing

### Test 10: Large Result Handling

**Steps:**

1. Execute a tool that returns large data (e.g., list directory with many files)
2. Verify result displays without lag
3. Try switching between result formats
4. **Expected Result:** Smooth performance ✅

---

### Test 11: Multiple Connections

**Steps:**

1. Create presets for both Filesystem and Web MCPs
2. Connect to Filesystem MCP
3. Execute a tool
4. Switch to Web MCP preset
5. Connect to Web MCP
6. Execute a tool
7. Switch back to Filesystem MCP
8. **Expected Result:** Both servers remain connected ✅

---

## Test Results Template

Use this template to document your testing:

```
Date: ___________
Tester: ___________
Device: ___________
MCP Hub Version: ___________

Test Results:
- [ ] Server Connection: ___________
- [ ] Tool Discovery: ___________
- [ ] Tool Execution (Filesystem): ___________
- [ ] Result Display Formats: ___________
- [ ] Execution History: ___________
- [ ] Server Presets: ___________
- [ ] Connection Timeout: ___________
- [ ] Invalid Parameters: ___________
- [ ] Server Unreachable: ___________
- [ ] Large Result Handling: ___________
- [ ] Multiple Connections: ___________

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

---

## Troubleshooting

### Server won't start

**Problem:** `npm install` or `npx` command fails

**Solution:**
- Ensure Node.js v18+ is installed: `node --version`
- Try clearing npm cache: `npm cache clean --force`
- Try installing globally: `npm install -g @modelcontextprotocol/server-filesystem`

---

### Connection refused

**Problem:** "Cannot connect to server"

**Solution:**
- Verify server is running: `lsof -i :3001` (check if port is in use)
- Verify host/port in MCP Hub settings
- If testing on physical device, ensure it's on same network as server
- For emulator, use `10.0.2.2` instead of `localhost`

---

### Tools not appearing

**Problem:** "No tools found" after connecting

**Solution:**
- Verify connection status shows "Connected"
- Try refreshing tool list (pull down to refresh)
- Check server logs for errors
- Try reconnecting

---

### Results not displaying

**Problem:** "Error displaying result"

**Solution:**
- Check result format selection
- Try switching to different format
- Check if result is too large (>1MB)
- Try executing a simpler tool first

---

## Next Steps

After successful testing:

1. **Document findings** using the test results template
2. **Report any issues** with detailed steps to reproduce
3. **Test on real Android device** (not just emulator)
4. **Test with custom MCP servers** you've built
5. **Performance test** with large datasets

---

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude MCP Servers](https://github.com/modelcontextprotocol/servers)
- [MCP Hub GitHub](https://github.com/yourusername/mcp-hub)

---

## Contact & Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review this guide for troubleshooting steps
