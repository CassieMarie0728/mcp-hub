import { Redirect } from 'expo-router';

/**
 * Provider-specific static tool catalogs are unavailable because vendor REST
 * APIs are not interchangeable with real MCP servers. Use secure server
 * registration, then discover tools through the authorized MCP runtime.
 */
export default function ToolBrowserScreen() {
  return <Redirect href="/server-connection" />;
}
