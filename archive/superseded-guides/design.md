# MCP Hub - Mobile App Design

## Overview
MCP Hub is a unified dashboard for connecting, managing, and interacting with multiple MCP (Model Context Protocol) servers. Users can add servers, explore available tools, and execute commands directly from their mobile device.

## Design Philosophy
- **Mobile-first**: Optimized for portrait orientation (9:16) and one-handed usage
- **Dark theme**: Reduces eye strain and aligns with developer aesthetic
- **Minimal friction**: Fast server discovery, quick tool access, instant execution
- **iOS-native feel**: Follows Apple Human Interface Guidelines for smooth, intuitive interactions

---

## Screen List

### 1. **Home Dashboard**
The entry point showing an overview of all connected servers and recent activity.

**Content:**
- Welcome header with quick stats (e.g., "3 servers connected")
- List of connected servers as horizontal scrollable cards
- Quick-access buttons: "Add Server", "Browse Tools"
- Recent activity feed (last executed tools/commands)

**Functionality:**
- Tap server card to view server details
- Swipe to reveal delete/edit options
- Pull-to-refresh to sync server status

### 2. **Server List**
A comprehensive view of all connected MCP servers with filtering and sorting.

**Content:**
- Full list of servers with status indicators (online/offline)
- Server metadata: name, description, tool count, last connected
- Search/filter bar at top
- Add server button (floating or in header)

**Functionality:**
- Tap to view server details
- Long-press to edit or delete
- Filter by status, name, or category
- Sort by name, date added, or tool count

### 3. **Add/Edit Server**
A form for connecting a new MCP server or editing existing connection details.

**Content:**
- Server name field (text input)
- Connection type selector (stdio, SSE, WebSocket)
- Connection details (command/URL, environment variables)
- Authentication fields (if applicable)
- Test connection button
- Save/Cancel buttons

**Functionality:**
- Validate connection details before saving
- Show success/error feedback
- Auto-detect server capabilities on first connection
- Store connection securely

### 4. **Server Detail**
A detailed view of a single server with all its tools and metadata.

**Content:**
- Server header: name, status, last connected time
- Server description and metadata
- Tabs: Tools, Settings, Logs
- **Tools tab**: List of available tools with descriptions and parameter counts
- **Settings tab**: Edit connection, view credentials, manage permissions
- **Logs tab**: Recent execution logs and errors

**Functionality:**
- Tap tool to view details and execute
- Search/filter tools by name or category
- Copy tool descriptions or command syntax
- View execution history

### 5. **Tool Detail & Execution**
A detailed view of a single tool with parameter input and execution controls.

**Content:**
- Tool name and full description
- Parameter input fields (auto-generated from tool schema)
- Input validation indicators
- Execute button
- Result display area (scrollable)
- Copy result button
- Execution history for this tool

**Functionality:**
- Dynamic form generation based on tool parameters
- Input validation with error messages
- Execute tool with parameters
- Display results in formatted JSON or plain text
- Show execution time and status
- Handle errors gracefully with retry option

### 6. **Settings**
App-level settings and preferences.

**Content:**
- Theme toggle (light/dark)
- Default execution timeout
- Log retention settings
- Clear cache / Clear logs
- About & version info
- Privacy & security settings

**Functionality:**
- Persist settings locally
- Toggle dark/light mode
- Manage data retention policies

---

## Primary Content & Functionality

### Home Dashboard
- **Primary content**: Server cards showing connection status, tool count, last activity
- **Key actions**: Add server, view server, refresh status
- **Layout**: Hero section + horizontal scroll + activity feed

### Server List
- **Primary content**: Searchable list of all servers with status badges
- **Key actions**: Add, edit, delete, filter, sort
- **Layout**: Search bar + list + floating action button

### Add/Edit Server
- **Primary content**: Form fields for server connection details
- **Key actions**: Validate connection, save, cancel, test connection
- **Layout**: Stacked form inputs + action buttons at bottom

### Server Detail
- **Primary content**: Server metadata + tabbed tool browser
- **Key actions**: View tools, edit settings, view logs
- **Layout**: Header + tab navigation + content area

### Tool Detail & Execution
- **Primary content**: Tool schema, parameter inputs, execution results
- **Key actions**: Input parameters, execute, view results, copy output
- **Layout**: Header + form + results area

---

## Key User Flows

### Flow 1: Add a New Server
1. User taps "Add Server" button on Home or Server List
2. Form screen appears with connection type selector
3. User enters server name and connection details
4. User taps "Test Connection" to validate
5. On success, user taps "Save"
6. Server is added to list and appears on Home dashboard
7. App fetches available tools from server

### Flow 2: Discover and Execute a Tool
1. User navigates to Server Detail
2. User searches or scrolls through Tools tab
3. User taps a tool to view its details
4. Tool Detail screen shows parameters and description
5. User fills in required parameters
6. User taps "Execute"
7. App sends request to MCP server
8. Results display in real-time (streaming if supported)
9. User can copy, share, or save results

### Flow 3: Manage Server Connections
1. User navigates to Server List
2. User long-presses a server card
3. Edit/Delete options appear
4. User can edit connection details or delete server
5. Changes are saved immediately

### Flow 4: Monitor Server Health
1. User views Home Dashboard or Server List
2. Status badges show server connectivity (green = online, red = offline)
3. User can pull-to-refresh to check status
4. Last connected timestamp shows freshness of connection

---

## Color Choices

### Brand Colors (Dark Theme)
- **Primary**: `#0a7ea4` (Teal/Cyan) - Action buttons, highlights, active states
- **Background**: `#151718` (Near-black) - Main screen background
- **Surface**: `#1e2022` (Dark gray) - Cards, elevated surfaces
- **Foreground**: `#ECEDEE` (Off-white) - Primary text
- **Muted**: `#9BA1A6` (Gray) - Secondary text, hints
- **Border**: `#334155` (Dark slate) - Dividers, borders
- **Success**: `#4ADE80` (Green) - Success states, online status
- **Warning**: `#FBBF24` (Amber) - Warning states
- **Error**: `#F87171` (Red) - Error states, offline status

### Light Theme (Fallback)
- **Primary**: `#0a7ea4` (Same teal)
- **Background**: `#ffffff` (White)
- **Surface**: `#f5f5f5` (Light gray)
- **Foreground**: `#11181C` (Dark gray/black)
- **Muted**: `#687076` (Medium gray)
- **Border**: `#E5E7EB` (Light gray)
- **Success**: `#22C55E` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)

---

## Interaction Patterns

### Button Feedback
- **Primary buttons**: Scale down to 0.97 on press + light haptic feedback
- **List items**: Opacity fade to 0.7 on press
- **Icons**: Opacity fade to 0.6 on press

### Haptic Feedback
- **Tool execution**: Light impact when button tapped
- **Server added**: Success notification haptic
- **Connection error**: Error notification haptic

### Loading States
- **Connecting**: Animated spinner with "Connecting..." text
- **Executing**: Progress indicator showing execution time
- **Results**: Fade in animation for results display

### Error Handling
- **Connection failed**: Toast notification + retry button
- **Invalid parameters**: Inline error messages under affected fields
- **Execution error**: Error details in results area with retry option

---

## Navigation Structure

```
Home (Dashboard)
├── Server Detail
│   ├── Tools Tab
│   │   └── Tool Detail & Execution
│   ├── Settings Tab
│   └── Logs Tab
├── Server List
│   ├── Add Server
│   └── Edit Server
└── Settings
    ├── Theme
    ├── Logs
    └── About
```

---

## Accessibility Considerations
- All buttons have minimum 44pt touch targets
- Color contrast meets WCAG AA standards
- Text sizes scale with system settings
- VoiceOver support for all interactive elements
- Haptic feedback provides non-visual feedback

---

## Performance Targets
- Home dashboard loads in < 1 second
- Server list renders 50+ servers smoothly
- Tool execution results display within 3 seconds
- Smooth 60fps scrolling and animations
