# MCP Hub Architecture

## Overview

MCP Hub is a React Native mobile application built with Expo, designed to provide a unified control center for managing MCP (Model Context Protocol) servers and executing tools across workflows. The architecture follows a modular, context-based state management pattern with clear separation of concerns.

## Technology Stack

| Layer                | Technology                   | Version          |
| -------------------- | ---------------------------- | ---------------- |
| **UI Framework**     | React Native                 | 0.81.5           |
| **App Framework**    | Expo                         | 54.0.29          |
| **Routing**          | Expo Router                  | 6.0.24           |
| **Styling**          | NativeWind (Tailwind CSS)    | 4.2.1            |
| **State Management** | React Context + AsyncStorage | -                |
| **API Client**       | tRPC + TanStack Query        | 11.7.2 / 5.90.12 |
| **Backend**          | Express.js                   | 4.22.1           |
| **Database**         | PostgreSQL                   | -                |
| **Language**         | TypeScript                   | 5.9.3            |

## Project Structure

```
mcp-hub/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── _layout.tsx          # Tab navigation setup
│   │   ├── index.tsx            # Home screen
│   │   ├── settings.tsx         # Settings with onboarding replay
│   │   └── [22 screens]         # Feature screens
│   ├── oauth/                   # OAuth callback handling
│   ├── macro/                   # Macro management routes
│   ├── template/                # Template routes
│   └── _disabled/               # Disabled screens (not in routing)
│
├── components/                   # Reusable UI components
│   ├── onboarding-modal.tsx     # Onboarding UI
│   ├── screen-container.tsx     # SafeArea wrapper
│   ├── error-boundary.tsx       # Error handling
│   └── ui/                      # UI component library
│
├── lib/                          # Core libraries and utilities
│   ├── _core/                   # Core functionality
│   │   ├── manus-runtime.ts     # Manus platform integration
│   │   ├── nativewind-pressable.ts
│   │   ├── theme.ts             # Theme configuration
│   │   └── [other utilities]
│   ├── onboarding-context.tsx   # Onboarding state management
│   ├── app-context.tsx          # App-wide state management
│   ├── theme-provider.tsx       # Theme provider
│   ├── trpc.ts                  # tRPC client setup
│   └── utils.ts                 # Utility functions
│
├── hooks/                        # Custom React hooks
│   ├── use-colors.ts            # Theme colors hook
│   ├── use-color-scheme.ts      # Color scheme detection
│   ├── use-auth.ts              # Authentication hook
│   ├── use-ai-assistant.ts      # AI assistant hook
│   ├── use-push-notifications.ts
│   └── use-mcp-service.ts       # MCP service hook
│
├── constants/                    # Constants and configuration
│   └── theme.ts                 # Theme constants
│
├── server/                       # Backend Express server
│   ├── _core/                   # Core server setup
│   ├── routers/                 # API route handlers
│   └── middleware/              # Express middleware
│
├── public/                       # Static assets
├── assets/                       # App assets (icons, images)
├── global.css                    # Global Tailwind styles
├── tailwind.config.js            # Tailwind configuration
├── theme.config.js               # Theme tokens
├── app.config.ts                 # Expo app configuration
├── metro.config.cjs              # Metro bundler configuration
└── package.json                  # Dependencies and scripts
```

## State Management Architecture

### Context Providers (Root Layout)

The app uses a layered provider architecture:

```
GestureHandlerRootView
  └── trpc.Provider
      └── QueryClientProvider
          └── SafeAreaProvider
              └── ThemeProvider
                  └── OnboardingProvider
                      └── AIAssistantProvider
                          └── AppProvider
                              └── App Content
```

### Key Contexts

#### 1. **OnboardingContext** (`lib/onboarding-context.tsx`)

- **Purpose**: Manages onboarding flow state
- **State**: Current step, completion status, progress
- **Persistence**: AsyncStorage
- **Functions**: nextStep, previousStep, skipOnboarding, completeOnboarding, resetOnboarding

#### 2. **AppContext** (`lib/app-context.tsx`)

- **Purpose**: Global app state (servers, tools, execution history)
- **State**: Servers list, tools, execution results, user preferences
- **Persistence**: AsyncStorage + Backend sync
- **Functions**: CRUD operations for servers, tools, macros

#### 3. **ThemeProvider** (`lib/theme-provider.tsx`)

- **Purpose**: Theme management (light/dark mode)
- **State**: Current theme, color scheme
- **Persistence**: AsyncStorage
- **Functions**: toggleTheme, setTheme

#### 4. **AIAssistantProvider** (`hooks/use-ai-assistant.ts`)

- **Purpose**: AI assistant state and interactions
- **State**: Chat history, assistant status
- **Persistence**: AsyncStorage
- **Functions**: sendMessage, clearHistory, toggleAssistant

## Data Flow

### User Authentication Flow

```
User → OAuth Login → OAuth Callback → Session Storage → Protected Routes
```

### MCP Server Connection Flow

```
User Input → AppContext → Backend API → Server Validation → Storage → UI Update
```

### Tool Execution Flow

```
User Selection → Tool Details → Parameter Input → Execute → History Storage → Result Display
```

## API Architecture (tRPC)

The app uses tRPC for type-safe API communication:

```typescript
// Client-side type-safe API calls
const result = await trpc.server.connect.mutate({ url, auth });
const servers = await trpc.server.list.query();
```

### API Endpoints Structure

- `/server` - Server management (connect, list, delete, update)
- `/tool` - Tool operations (list, execute, get details)
- `/execution` - Execution history (list, get, delete)
- `/macro` - Macro management (create, list, execute, delete)
- `/user` - User settings and preferences
- `/ai` - AI assistant endpoints

## Component Architecture

### Screen Components

- Located in `app/(tabs)/`
- Use `ScreenContainer` for proper SafeArea handling
- Implement error boundaries for error handling
- Use hooks for state management

### UI Components

- Located in `components/`
- Reusable across screens
- Styled with Tailwind CSS (NativeWind)
- Type-safe with TypeScript

### Custom Hooks

- Located in `hooks/`
- Encapsulate business logic
- Provide clean API for components
- Handle side effects with useEffect

## Error Handling

### Error Boundary

- Catches React component errors
- Displays user-friendly error UI
- Provides recovery options
- Logs errors for debugging

### API Error Handling

- tRPC handles network errors
- TanStack Query provides retry logic
- Error messages displayed to users
- Errors logged to console in development

## Performance Optimizations

1. **Code Splitting**: Expo Router handles automatic code splitting
2. **Lazy Loading**: Components loaded on-demand via routing
3. **Memoization**: React.memo for expensive components
4. **Caching**: TanStack Query caches API responses
5. **Image Optimization**: Expo Image component with caching
6. **Bundle Size**: Tree-shaking and minification in production

## Security Considerations

1. **Authentication**: OAuth 2.0 via Manus platform
2. **Token Storage**: Secure storage using expo-secure-store
3. **API Security**: tRPC with authentication middleware
4. **Data Validation**: TypeScript + Zod schema validation
5. **Environment Variables**: Sensitive data in .env files

## Deployment Architecture

### Development

```
Local Machine
  ├── Metro Bundler (Port 8081)
  ├── Express Server (Port 3000)
  └── Expo Go (iOS/Android)
```

### Production

```
Cloud Platform (Vercel/Firebase)
  ├── Frontend (Static assets)
  ├── Backend (Node.js)
  └── Database (PostgreSQL)
```

## Key Design Patterns

### 1. **Provider Pattern**

Context providers wrap the app to provide global state and utilities.

### 2. **Hook Pattern**

Custom hooks encapsulate business logic and state management.

### 3. **Container/Presentational Pattern**

Screens (containers) manage logic, components (presentational) handle UI.

### 4. **Error Boundary Pattern**

Error boundaries catch and handle component errors gracefully.

### 5. **Context Selector Pattern**

Consumers can select specific parts of context to avoid unnecessary re-renders.

## Testing Architecture

### Unit Tests

- Located in `lib/__tests__/`
- Test business logic and utilities
- Use Vitest framework

### Integration Tests

- Located in `tests/`
- Test API endpoints and workflows
- Test authentication flows

### Component Tests

- Test UI components in isolation
- Test user interactions
- Test accessibility

## Future Improvements

1. **State Management**: Consider Redux Toolkit or Zustand for complex state
2. **Performance**: Add performance monitoring and analytics
3. **Offline Support**: Implement offline-first architecture with local database
4. **Real-time Updates**: Add WebSocket support for real-time tool execution
5. **Advanced Caching**: Implement more sophisticated caching strategies
6. **Accessibility**: Enhance accessibility features and testing
7. **Internationalization**: Add multi-language support

## Related Documentation

- [Environment Variables](./ENV_VARIABLES.md)
- [Review Findings](./REVIEW_FINDINGS.md)
- [README](./README.md)
