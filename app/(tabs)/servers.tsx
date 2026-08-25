import { Redirect } from 'expo-router';

/**
 * Server state and lifecycle now live exclusively in the tenant-backed HTTPS
 * registration screen. This former device-local list could diverge from the
 * secure workspace records, so it redirects to the canonical workflow.
 */
export default function ServersScreen() {
  return <Redirect href="/server-connection" />;
}
