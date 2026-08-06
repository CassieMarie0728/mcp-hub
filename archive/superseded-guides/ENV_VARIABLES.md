# Environment Variables Documentation

This document describes all environment variables used by MCP Hub.

## Required Variables

### API Configuration
- **`EXPO_PUBLIC_API_URL`** - Backend API base URL
  - Default: `http://localhost:3000`
  - Example: `https://api.mcphub.com`

### Authentication
- **`EXPO_PUBLIC_OAUTH_CLIENT_ID`** - OAuth client ID for authentication
  - Required for production deployments
  - Obtain from your OAuth provider

## Optional Variables

### Features & Toggles
- **`EXPO_PUBLIC_ENABLE_ONBOARDING`** - Enable/disable onboarding flow
  - Default: `true`
  - Values: `true` or `false`

- **`EXPO_PUBLIC_ENABLE_AI_ASSISTANT`** - Enable/disable AI assistant
  - Default: `true`
  - Values: `true` or `false`

- **`EXPO_PUBLIC_ENABLE_NOTIFICATIONS`** - Enable/disable push notifications
  - Default: `true`
  - Values: `true` or `false`

### Development
- **`NODE_ENV`** - Environment mode
  - Values: `development` or `production`
  - Default: `development`

- **`EXPO_PUBLIC_DEBUG`** - Enable debug logging
  - Default: `false`
  - Values: `true` or `false`

- **`EXPO_PORT`** - Metro bundler port
  - Default: `8081`

## Setting Environment Variables

### Local Development
Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_OAUTH_CLIENT_ID=your_client_id
NODE_ENV=development
```

### Production
Use your hosting platform's environment variable configuration:
- **Vercel**: Project Settings → Environment Variables
- **Firebase**: Firebase Console → Project Settings
- **AWS**: Systems Manager → Parameter Store or Secrets Manager
- **Docker**: Pass via `-e` flag or `.env` file

## Important Notes

⚠️ **Security**
- `EXPO_PUBLIC_*` variables are embedded in the app bundle and visible to users
- Do NOT put sensitive secrets in `EXPO_PUBLIC_*` variables
- Use regular environment variables for sensitive data (API keys, tokens, etc.)
- Never commit `.env` files to version control

✅ **Best Practices**
- Use `.env.local` for local overrides
- Document all new environment variables in this file
- Provide sensible defaults
- Use clear, descriptive names
- Group related variables together

## Troubleshooting

**"Environment variable not found"**
- Ensure the variable is defined in your `.env` file
- Restart the dev server after adding new variables
- Check that the variable name matches exactly (case-sensitive)

**"Changes not taking effect"**
- Restart the Expo dev server: `pnpm dev`
- Clear the Metro bundler cache: `pnpm dev -- --reset-cache`
- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
