# Android MCP Server Hub - Project TODO

## Phase 1: Eject from Expo to Bare React Native ✅ COMPLETE

- [x] Backup current Expo project
- [x] Run `expo prebuild` to generate native Android/iOS folders
- [x] Set up Android Studio project structure
- [x] Configure Gradle for native module development
- [x] Create native module bridge structure (Java/Kotlin)
- [x] Test React Native bridge communication
- [x] Verify existing React Native UI still works

## Phase 2: Kotlin MCP Server Backend

### Core MCP Server
- [ ] Create Kotlin MCP server library
- [ ] Implement JSON-RPC 2.0 protocol handler
- [ ] Build HTTP transport (OkHttp)
- [ ] Build SSE (Server-Sent Events) transport
- [ ] Build WebSocket transport (OkHttp WebSocket)
- [ ] Build stdio transport (process pipes)
- [ ] Implement tool discovery mechanism
- [ ] Implement tool execution handler
- [ ] Add request/response validation

### Server Lifecycle
- [ ] Create Android Service class
- [ ] Implement foreground service (notification)
- [ ] Add service start/stop controls
- [ ] Implement wake lock management
- [ ] Add battery optimization
- [ ] Handle app lifecycle (pause/resume)

## Phase 3: OAuth 2.0 & Secure Storage

### Authentication
- [ ] Implement OAuth 2.0 flow (authorization code)
- [ ] Create token refresh mechanism
- [ ] Add session management
- [ ] Implement logout functionality
- [ ] Add user profile management

### Credential Storage
- [ ] Use EncryptedSharedPreferences for tokens
- [ ] Implement secure credential storage
- [ ] Add encryption key management
- [ ] Create credential rotation mechanism
- [ ] Add secure deletion on logout

## Phase 4: Modular Tool System

### Tool Architecture
- [ ] Create abstract Tool base class
- [ ] Implement tool metadata system
- [ ] Build tool registry/discovery
- [ ] Create tool execution pipeline
- [ ] Add error handling and logging

### Android API Modules
- [ ] **File System Module** (read/write files, list directories)
- [ ] **Contacts Module** (query contacts, add/edit contacts)
- [ ] **Calendar Module** (read/create events)
- [ ] **Sensors Module** (GPS, accelerometer, gyroscope)
- [ ] **Device Info Module** (battery, connectivity, device specs)
- [ ] **Notifications Module** (send notifications)
- [ ] **Messaging Module** (SMS, read messages)
- [ ] **Media Module** (photos, videos, audio)
- [ ] **Network Module** (WiFi, cellular info)
- [ ] **System Module** (settings, app info)

### Each Module Includes
- [ ] Tool definition (name, description, parameters)
- [ ] Permission requirements
- [ ] Input validation
- [ ] Execution logic
- [ ] Error handling
- [ ] Result formatting

## Phase 5: IPC Bridge (React Native ↔ Kotlin)

### Communication Layer
- [ ] Create Kotlin module for React Native
- [ ] Implement service start/stop commands
- [ ] Build tool configuration interface
- [ ] Create status/monitoring interface
- [ ] Add log streaming
- [ ] Implement real-time updates (events)

### React Native Integration
- [ ] Create native module bridge
- [ ] Implement service control hooks
- [ ] Add event listeners
- [ ] Create state management for service status
- [ ] Add error handling

## Phase 6: Permission Manager & Service Lifecycle

### Permission Management
- [ ] Create permission request system
- [ ] Implement runtime permission handling
- [ ] Build permission UI (request/grant/deny)
- [ ] Add permission caching
- [ ] Create permission audit log

### Foreground Service
- [ ] Implement persistent notification
- [ ] Add service control (start/stop/restart)
- [ ] Create battery optimization strategy
- [ ] Implement wake lock management
- [ ] Add background execution limits handling

### Lifecycle Hooks
- [ ] Handle app pause/resume
- [ ] Manage service on device reboot
- [ ] Implement graceful shutdown
- [ ] Add state persistence

## Phase 7: UI Enhancements

### Service Management
- [ ] Create service status dashboard
- [ ] Add start/stop/restart buttons
- [ ] Show service logs in real-time
- [ ] Display active connections
- [ ] Show resource usage (CPU, memory, battery)

### Tool Configuration
- [ ] Create tool enable/disable toggles
- [ ] Build tool parameter configuration
- [ ] Add tool testing interface
- [ ] Show tool execution history
- [ ] Create tool documentation viewer

### Transport Configuration
- [ ] Create HTTP/SSE config screen
- [ ] Add WebSocket config screen
- [ ] Build stdio config screen
- [ ] Show active transports
- [ ] Add connection status indicators

### OAuth & Security
- [ ] Create login/logout UI
- [ ] Build token management screen
- [ ] Add permission request UI
- [ ] Show security audit log
- [ ] Create credential management interface

## Phase 8: Security & Performance

### Security Hardening
- [ ] Implement input validation on all tools
- [ ] Add rate limiting
- [ ] Create request signing mechanism
- [ ] Implement CORS/CSRF protection
- [ ] Add request logging and audit trail
- [ ] Implement data encryption at rest
- [ ] Add secure communication (TLS/SSL)

### Performance Optimization
- [ ] Profile memory usage
- [ ] Optimize tool execution
- [ ] Implement connection pooling
- [ ] Add caching where appropriate
- [ ] Optimize battery usage
- [ ] Implement request queuing
- [ ] Add performance monitoring

### Testing
- [ ] Unit tests for MCP protocol
- [ ] Integration tests for tool modules
- [ ] Security tests (permission, auth)
- [ ] Performance tests
- [ ] Battery drain tests
- [ ] Connection stability tests

## Completed Features (from Phase 6)

### Chat Interface
- [x] Chat screen as primary interface
- [x] Tool execution from chat
- [x] Server selector in chat
- [x] Quick tool buttons

### Edit Server
- [x] Edit server screen
- [x] Headers support for authentication
- [x] Dynamic header key-value pairs

### Execution Timeout
- [x] Timeout toggle in settings
- [x] Timeout duration configuration
- [x] Respect timeout setting in MCP client

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         Android Device (User's Phone)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  React Native UI (Chat, Config, Logs)        │  │
│  │  - Service management                        │  │
│  │  - Tool configuration                        │  │
│  │  - OAuth 2.0 login                           │  │
│  └──────────────────────────────────────────────┘  │
│                        ↕ (IPC)                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Native Android Service (Kotlin)             │  │
│  │  - MCP Server (HTTP/SSE/WebSocket/stdio)    │  │
│  │  - Tool Modules (modular system)             │  │
│  │  - Permission Manager                        │  │
│  │  - Credential Store (encrypted)              │  │
│  │  - Foreground Service (battery-optimized)   │  │
│  └──────────────────────────────────────────────┘  │
│                        ↕                            │
│  ┌──────────────────────────────────────────────┐  │
│  │  Android APIs (via Java/Kotlin)              │  │
│  │  - FileSystem, MediaStore                    │  │
│  │  - Contacts, Calendar                        │  │
│  │  - LocationManager, SensorManager            │  │
│  │  - NotificationManager, etc.                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
                        ↕
        ┌───────────────────────────────┐
        │  External AI Clients          │
        │  (LLMs, Agents)               │
        │  Connect via HTTP/SSE/etc.    │
        └───────────────────────────────┘
```

---

## Key Technologies

- **Frontend:** React Native 0.81 + Expo (managing UI only)
- **Backend:** Kotlin + Android Framework
- **MCP Protocol:** Custom Kotlin implementation (JSON-RPC 2.0)
- **Networking:** OkHttp (HTTP/SSE/WebSocket)
- **Storage:** EncryptedSharedPreferences (credentials)
- **Authentication:** OAuth 2.0 + JWT tokens
- **IPC:** Android Messenger / Direct JNI calls
- **Testing:** JUnit, Espresso, Robolectric

---

## Success Criteria

- [ ] Service runs reliably in background
- [ ] All transport modes work (HTTP/SSE/WebSocket/stdio)
- [ ] All Android API modules functional
- [ ] OAuth 2.0 authentication secure
- [ ] Permissions properly managed
- [ ] Battery drain minimal
- [ ] UI responsive and intuitive
- [ ] Comprehensive error handling
- [ ] Full test coverage
- [ ] Security audit passed
