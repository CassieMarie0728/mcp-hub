import { Redirect } from 'expo-router';

/**
 * The former provider registry treated vendor REST APIs as if they exposed MCP
 * endpoints. Server registration is now intentionally centralized in the
 * HTTPS-only tenant-backed connection workflow.
 */
export default function MCPServersScreen() {
  return <Redirect href="/server-connection" />;
}
