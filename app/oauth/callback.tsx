import { ThemedView } from '@/components/themed-view';
import * as Api from '@/lib/_core/api';
import * as Auth from '@/lib/_core/auth';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CallbackParams = {
  code?: string;
  state?: string;
  error?: string;
  sessionToken?: string;
  user?: string;
};

async function storeCallbackUser(encodedUser: string | undefined) {
  if (!encodedUser) return;

  try {
    const userJson = typeof atob !== 'undefined'
      ? atob(encodedUser)
      : Buffer.from(encodedUser, 'base64').toString('utf-8');
    const userData = JSON.parse(userJson);
    const userInfo: Auth.User = {
      id: userData.id,
      openId: userData.openId,
      name: userData.name,
      email: userData.email,
      loginMethod: userData.loginMethod,
      lastSignedIn: new Date(userData.lastSignedIn || Date.now()),
    };
    await Auth.setUserInfo(userInfo);
  } catch {
    // A session may be valid even if optional callback profile data is absent or malformed.
  }
}

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<CallbackParams>();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const fail = (message: string) => {
      if (!active) return;
      setStatus('error');
      setErrorMessage(message);
    };

    const complete = () => {
      if (!active) return;
      setStatus('success');
      redirectTimer = setTimeout(() => {
        if (active) router.replace('/(tabs)');
      }, 1_000);
    };

    const handleCallback = async () => {
      try {
        if (params.sessionToken) {
          await Auth.setSessionToken(params.sessionToken);
          await storeCallbackUser(params.user);
          complete();
          return;
        }

        let callbackUrl: string | null = null;
        if (params.code || params.state || params.error) {
          const query = new URLSearchParams();
          if (params.code) query.set('code', params.code);
          if (params.state) query.set('state', params.state);
          if (params.error) query.set('error', params.error);
          callbackUrl = `?${query.toString()}`;
        } else {
          callbackUrl = await Linking.getInitialURL();
        }

        const callbackParams = callbackUrl
          ? new URL(callbackUrl, 'mcp-hub://oauth/callback').searchParams
          : null;
        if (params.error || callbackParams?.get('error')) {
          fail('Authorization was declined or expired. Please try again.');
          return;
        }

        const sessionToken = callbackParams?.get('sessionToken');
        if (sessionToken) {
          await Auth.setSessionToken(sessionToken);
          complete();
          return;
        }

        const code = params.code ?? callbackParams?.get('code');
        const state = params.state ?? callbackParams?.get('state');
        if (!code || !state) {
          fail('The authorization response was incomplete. Please try again.');
          return;
        }

        const result = await Api.exchangeOAuthCode(code, state);
        if (!result.sessionToken) {
          fail('Authentication could not be completed. Please try again.');
          return;
        }

        await Auth.setSessionToken(result.sessionToken);
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email,
            loginMethod: result.user.loginMethod,
            lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
          });
        }
        complete();
      } catch {
        fail('Authentication could not be completed. Please try again.');
      }
    };

    handleCallback();
    return () => {
      active = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [params.code, params.error, params.sessionToken, params.state, params.user, router]);

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">Completing authentication...</Text>
          </>
        )}
        {status === 'success' && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">Authentication successful!</Text>
            <Text className="text-base leading-6 text-center text-foreground">Redirecting...</Text>
          </>
        )}
        {status === 'error' && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">Authentication failed</Text>
            <Text className="text-base leading-6 text-center text-foreground">{errorMessage}</Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
