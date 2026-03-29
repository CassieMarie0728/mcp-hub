# Android MCP Server Hub - Full Vision TODO

## Phase 1: Eject from Expo to Bare React Native ✅ COMPLETE

- [x] Backup current Expo project
- [x] Run `expo prebuild` to generate native Android/iOS folders
- [x] Set up Android Studio project structure
- [x] Configure Gradle for native module development
- [x] Create native module bridge structure (Java/Kotlin)
- [x] Test React Native bridge communication
- [x] Verify existing React Native UI still works

---

## Phase 2: Kotlin MCP Server Backend with Transport Support ✅ COMPLETE

### JSON-RPC 2.0 Protocol Handler
- [x] Create JSONRPCHandler.kt for request/response parsing
- [x] Implement method routing and parameter validation
- [x] Add error handling (invalid method, parse error, internal error)
- [x] Create response formatter with proper JSON-RPC structure

### HTTP Transport Implementation
- [x] Set up HTTP server with routing
- [x] Implement `/mcp/tools/list` endpoint (tool discovery)
- [x] Implement `/mcp/tools/call` endpoint (tool execution)
- [x] Add request logging and error responses
- [x] Implement CORS headers for cross-origin requests

### SSE (Server-Sent Events) Transport
- [x] Implement SSE connection handler
- [x] Add persistent connection management
- [x] Handle client disconnections gracefully
- [x] Implement message streaming for long-running operations

### WebSocket Transport
- [x] Set up WebSocket server
- [x] Implement bidirectional message handling
- [x] Add connection lifecycle management
- [x] Handle reconnection logic

### Stdio Transport
- [x] Implement stdin/stdout message reading
- [x] Add buffering for multi-line messages
- [x] Handle process lifecycle

### Transport Factory & Integration
- [x] Create TransportFactory.kt for unified transport management
- [x] Integrate all transports into MCPServer
- [x] Add transport lifecycle management
- [x] Create transport status reporting

### Error Handling & Logging
- [x] Create ErrorHandler.kt with standardized error responses
- [x] Implement custom exception types
- [x] Add comprehensive logging throughout
- [x] Create error recovery mechanisms

### Testing
- [x] Create Phase2Tests.kt with comprehensive test suite
- [x] Test JSON-RPC protocol handler
- [x] Test tool discovery
- [x] Test transport factory
- [x] Test error handling
- [x] Test tool module initialization

---

## Phase 3: OAuth 2.0 Authentication & Secure Storage ✅ COMPLETE

### OAuth 2.0 Flow
- [ ] Implement OAuth 2.0 authorization code flow
- [ ] Create token exchange mechanism
- [ ] Add token refresh logic
- [ ] Implement scope-based permissions

### Secure Credential Storage
- [ ] Use Android EncryptedSharedPreferences for tokens
- [ ] Implement KeyStore for key management
- [ ] Add credential rotation
- [ ] Create secure logout mechanism

### Session Management
- [ ] Implement session tracking
- [ ] Add timeout handling
- [ ] Create session revocation
- [ ] Add multi-device session management

---

## Phase 4: Modular Tool System for Android APIs ✅ COMPLETE

### Files Tool Module (Full Implementation)
- [ ] Implement `list_files` with directory traversal
- [ ] Implement `read_file` with encoding detection
- [ ] Implement `write_file` with overwrite protection
- [ ] Add `delete_file` with confirmation
- [ ] Add `create_directory` functionality
- [ ] Implement file search and filtering

### Calendar Tool Module (Full Implementation)
- [ ] Implement `list_events` with date range filtering
- [ ] Implement `create_event` with reminders
- [ ] Add `update_event` functionality
- [ ] Add `delete_event` with confirmation
- [ ] Implement recurring event support
- [ ] Add calendar selection

### Storage Tool Module (Full Implementation)
- [ ] Implement `get_storage_info` with partition details
- [ ] Implement `get_free_space` calculation
- [ ] Add `clear_cache` functionality
- [ ] Implement storage usage breakdown by app
- [ ] Add low storage warnings

### Communication Tool Module (Full Implementation)
- [ ] Implement `list_sms` with filtering and pagination
- [ ] Implement `send_sms` with delivery confirmation
- [ ] Add `get_call_logs` with filtering
- [ ] Implement `list_contacts` functionality
- [ ] Add `send_email` capability
- [ ] Implement `get_messages` from messaging apps

### Additional Modules (Extensible)
- [ ] Sensors module (GPS, accelerometer, camera)
- [ ] Device Info module (battery, network, system info)
- [ ] Notifications module (send/receive)
- [ ] Media module (photos, videos, audio)

---

## Phase 5: IPC Bridge (React Native ↔ Kotlin) ✅ COMPLETE

### React Native Native Module
- [x] Create MCPServerBridge.kt for React Native side
- [x] Implement method calls to native module
- [x] Add event listeners for server events
- [x] Create error handling wrapper

### Kotlin Native Module Enhancement
- [x] Implement bidirectional communication
- [x] Add event emission to React Native
- [x] Create callback handlers
- [x] Implement state synchronization

### Communication Protocol
- [x] Define message format for IPC
- [x] Implement request/response matching
- [x] Add timeout handling
- [x] Create logging for debugging

---

## Phase 6: Permission Manager & Service Lifecycle ✅ PARTIAL

### Runtime Permissions ✅ COMPLETE
- [x] Implement permission request system (PermissionManager.kt)
- [x] Add permission checking before tool execution (MCPServerBridgeWithPermissions.kt)
- [x] Create permission UI prompts (PermissionBridge.kt)
- [x] Implement permission caching (PermissionManager.kt)

### Foreground Service ✅ COMPLETE
- [x] Create MCP server foreground service (MCPServerService.kt)
- [x] Implement notification for service status (with toggle)
- [x] Add service lifecycle management (START_STICKY)
- [x] Implement wake lock management (via foreground service)

### Background Service Management
- [ ] Handle app backgrounding/foregrounding
- [ ] Implement service restart on crash
- [ ] Add battery optimization
- [ ] Create low-memory handling

---

## Phase 7: Hybrid Perception Engine (AI-Optimized UI Analysis) ✅ COMPLETE

### Accessibility Service Integration ✅
- [x] Implement AccessibilityService for UI tree access (PerceptionAccessibilityService.kt)
- [x] Create AccessibilityEvent listener
- [x] Parse AccessibilityNodeInfo tree
- [x] Extract interactive elements (buttons, inputs, etc.)

### Structured Accessibility Snapshots ✅
- [x] Create JSON formatter for accessibility tree (PerceptionFormatter.kt)
- [x] Extract element properties (text, contentDescription, bounds)
- [x] Add coordinate mapping
- [x] Implement element filtering (only interactive elements)
- [x] Create condensed JSON output format

### Visual Chip Generator ✅
- [x] Implement screenshot capture (VisualChipGenerator.kt)
- [x] Create cropping logic for individual elements
- [x] Add image compression for efficiency
- [x] Implement Base64 encoding for transmission
- [x] Add fallback for unrecognized elements

### Hybrid Perception Formatter ✅
- [x] Create unified output format (accessibility + visual) (PerceptionFormatter.kt)
- [x] Implement smart switching (accessibility first, visual fallback)
- [x] Add element confidence scoring
- [x] Create token-efficient output

### Perception Engine API ✅
- [x] Implement `captureHybridPerception` endpoint (HybridPerceptionEngine.kt)
- [x] Implement `getInteractiveElements` endpoint
- [x] Add `getPerceptionAsJSON` endpoint (combined)
- [x] Create caching for performance (PerceptionCache)

---

## Phase 8: Local Macro System (Intent-to-Action) 🔨 IN PROGRESS

### Perception Engine Integration ✅
- [x] Create PerceptionBridge.kt for React Native exposure
- [x] Implement React Native bridge methods
- [x] Create use-perception-engine.ts TypeScript hook
- [x] Add perception monitoring and comparison hooks
- [x] Comprehensive test suite (29 tests passing)

### Macro Definition & Registry
- [ ] Create MacroDefinition data class
- [ ] Build MacroRegistry.kt for macro management
- [ ] Implement macro CRUD operations
- [ ] Add macro persistence to CredentialStore

### Intent Parser
- [ ] Create IntentParser.kt for high-level intent parsing
- [ ] Implement pattern matching for macro triggers
- [ ] Add parameter extraction from intent strings
- [ ] Support variable substitution (${contact}, ${message})

### Action Executor
- [ ] Create ActionExecutor.kt for sequential action execution
- [ ] Implement local state tracking (keyboard, app state, screen position)
- [ ] Add tap/swipe/text input actions
- [ ] Implement conditional logic (if/then/else)
- [ ] Add error recovery and rollback

### Macro Examples
- [ ] send_whatsapp_message(contact, message)
- [ ] send_email(recipient, subject, body)
- [ ] create_calendar_event(title, date, time)
- [ ] open_app_and_search(app, query)
- [ ] fill_form(fields)

### MacroBridge
- [ ] Create MacroBridge.kt for React Native exposure
- [ ] Implement macro execution from React Native
- [ ] Add macro listing and management methods

### use-macros Hook
- [ ] Create use-macros.ts TypeScript hook
- [ ] Implement macro execution, listing, and management

---

## Phase 9: Contextual Governance Layer (Security & Control)

### App Sandboxing
- [ ] Create app allowlist/blacklist system
- [ ] Implement per-app permission control
- [ ] Add app-level tool filtering
- [ ] Create app metadata storage

### Interactive Consent System
- [ ] Create consent overlay UI (native Android)
- [ ] Implement approval/denial logic
- [ ] Add timeout for consent requests
- [ ] Create consent history

### Sensitive Operation Gating
- [ ] Identify sensitive operations (delete, payment, etc.)
- [ ] Implement consent requirement for sensitive tools
- [ ] Add confirmation dialogs
- [ ] Create override mechanisms for trusted operations

### Audit Logging
- [ ] Log all AI actions with timestamp
- [ ] Record tool calls and results
- [ ] Track permission grants/denials
- [ ] Implement audit log export
- [ ] Create audit log viewer UI

### Governance Configuration
- [ ] Create governance settings UI
- [ ] Implement rule creation interface
- [ ] Add rule testing/simulation
- [ ] Create governance profiles (strict, balanced, permissive)

---

## Phase 10: Bug Fixes & JSON Config Import/Export 🔨 IN PROGRESS

### Bug Fixes
- [ ] Fix React Hooks violation in server-detail.tsx (Invalid hook call error)
- [ ] Verify all hooks are called at component top level
- [ ] Fix Tools tab rendering issue

### JSON Config Import/Export
- [ ] Add JSON config export button to server-detail screen
- [ ] Add JSON config import option to add-server screen
- [ ] Add JSON config import option to edit-server screen
- [ ] Create config file picker using document picker
- [ ] Validate imported config JSON schema
- [ ] Show import preview before confirming
- [ ] Support bulk server import from JSON file

---

## Phase 11: Dashboard & Management UI

### Audit Log Screen
- [ ] Create AuditLogScreen.tsx component
- [ ] Display tool executions with timestamp, tool name, parameters, result
- [ ] Add filtering by date range, tool name, status
- [ ] Add search functionality
- [ ] Show execution duration and resource usage
- [ ] Export audit logs as CSV/JSON

### Governance Management Screen
- [ ] Create GovernanceScreen.tsx component
- [ ] Allowlist/Blacklist management UI
- [ ] Add/remove apps from lists
- [ ] View current restrictions
- [ ] Test permissions for specific apps

### Consent History Screen
- [ ] Create ConsentHistoryScreen.tsx component
- [ ] Display all user consent approvals/denials
- [ ] Show timestamp, operation, result
- [ ] Add filtering by date, operation type
- [ ] Allow users to revoke previous consents

### Service Control Screen
- [ ] Create ServiceControlScreen.tsx component
- [ ] Start/Stop MCP server buttons
- [ ] Toggle persistent notification
- [ ] View service status (running, stopped, error)
- [ ] Display service uptime and resource usage
- [ ] View service logs

### Perception Testing Screen
- [ ] Create PerceptionTestScreen.tsx component
- [ ] Display current accessibility tree snapshot (JSON)
- [ ] Show visual chips for unrecognized elements
- [ ] Allow manual perception refresh
- [ ] Compare perception snapshots over time
- [ ] Test perception accuracy on different apps

### Macro Management Screen
- [ ] Create MacroManagementScreen.tsx component
- [ ] List all defined macros
- [ ] Create/edit/delete macros
- [ ] Test macro execution
- [ ] View macro execution history
- [ ] Import/export macro definitions

### Dashboard Home Screen
- [ ] Create DashboardScreen.tsx (main entry point)
- [ ] Show quick stats (tool executions today, permissions granted, macros created)
- [ ] Display recent activity feed
- [ ] Quick access buttons to all dashboard screens
- [ ] System health indicators (service status, battery usage, memory)

### Settings Integration
- [ ] Add Dashboard tab to settings
- [ ] Link to all dashboard screens
- [ ] Add dashboard preferences (auto-refresh, log retention)

### Navigation & Routing
- [ ] Update app router to include dashboard screens
- [ ] Add navigation between dashboard sections
- [ ] Implement breadcrumb navigation
- [ ] Add back buttons to all screens

### UI Polish
- [ ] Add loading states to all screens
- [ ] Add error handling and user feedback
- [ ] Add empty states for no data
- [ ] Implement pagination for large lists
- [ ] Add dark/light mode support
- [ ] Add animations and transitions

---

## Phase 11: Security Hardening & Testing

### Security Audit
- [ ] Review all permission usage
- [ ] Audit credential storage
- [ ] Check transport encryption (HTTPS/WSS)
- [ ] Validate input sanitization

### Testing Suite
- [ ] Unit tests for MCP protocol
- [ ] Integration tests for tool modules
- [ ] E2E tests for common flows
- [ ] Performance benchmarks

### Performance Optimization
- [ ] Profile memory usage
- [ ] Optimize perception engine
- [ ] Reduce battery drain
- [ ] Minimize network overhead

### Documentation
- [ ] API documentation
- [ ] Tool module development guide
- [ ] Deployment instructions
- [ ] Security best practices guide

---

## Phase 12: Final Delivery

- [ ] Final testing and QA
- [ ] Performance verification
- [ ] Security review
- [ ] Documentation completion
- [ ] GitHub repository setup
- [ ] Release notes preparation


## Phase 10 Final: JSON Config UI + Dashboard + Testing 🚀

### JSON Config UI Enhancements
- [ ] Add "Import Config" button to Add Server screen
- [ ] Add "Export Config" button to Edit Server screen
- [ ] Add optional JSON paste input field (collapsible/expandable)
- [ ] Validate pasted JSON in real-time
- [ ] Show preview of imported config before confirming
- [ ] Handle edge cases (invalid JSON, missing fields, malformed data)
- [ ] Add copy-to-clipboard for exported configs

### Dashboard Screens
- [ ] Create AuditLogScreen.tsx (view all tool executions)
- [ ] Create GovernanceScreen.tsx (manage allowlist/blacklist)
- [ ] Create ServiceControlScreen.tsx (start/stop server, toggle notification)
- [ ] Create DashboardHomeScreen.tsx (main dashboard with quick stats)
- [ ] Add navigation between dashboard screens
- [ ] Add filtering and search to audit logs
- [ ] Add export audit logs as CSV/JSON

### End-to-End Testing
- [ ] Test JSON import with valid config
- [ ] Test JSON import with invalid config (missing fields)
- [ ] Test JSON import with malformed JSON
- [ ] Test JSON export and re-import cycle
- [ ] Test direct JSON paste input
- [ ] Test on actual Android device
- [ ] Test on iOS device (if available)
- [ ] Test with large configs (many headers, many servers)
- [ ] Test permission flows end-to-end
- [ ] Test macro execution end-to-end
- [ ] Test governance consent flows
