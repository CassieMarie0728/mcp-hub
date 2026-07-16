/**
 * OAuth Manager
 * Handles OAuth flows for GitHub, Slack, and Notion
 */

import crypto from 'crypto';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
  tokenType: string;
}

export interface OAuthState {
  state: string;
  serverId: string;
  serverType: string;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory OAuth state store (would be replaced with database)
const oauthStateStore = new Map<string, OAuthState>();

// OAuth configurations
const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  github: {
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
    redirectUri:
      process.env.GITHUB_OAUTH_REDIRECT_URI || 'http://localhost:3000/oauth/github/callback',
    scopes: ['repo', 'user', 'gist'],
  },
  slack: {
    clientId: process.env.SLACK_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.SLACK_OAUTH_CLIENT_SECRET || '',
    redirectUri:
      process.env.SLACK_OAUTH_REDIRECT_URI || 'http://localhost:3000/oauth/slack/callback',
    scopes: ['chat:write', 'channels:read', 'users:read'],
  },
  notion: {
    clientId: process.env.NOTION_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.NOTION_OAUTH_CLIENT_SECRET || '',
    redirectUri:
      process.env.NOTION_OAUTH_REDIRECT_URI || 'http://localhost:3000/oauth/notion/callback',
    scopes: ['read', 'write'],
  },
};

export class OAuthManager {
  /**
   * Generate OAuth authorization URL
   */
  static generateAuthorizationUrl(
    serverType: 'github' | 'slack' | 'notion',
    serverId: string,
  ): { url: string; state: string } {
    const config = OAUTH_CONFIGS[serverType];
    if (!config.clientId) {
      throw new Error(`OAuth not configured for ${serverType}`);
    }

    // Generate state token
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 600000); // 10 minutes

    // Store state
    oauthStateStore.set(state, {
      state,
      serverId,
      serverType,
      createdAt: new Date(),
      expiresAt,
    });

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(serverType === 'github' ? ' ' : ','),
      state,
      response_type: 'code',
    });

    const baseUrls: Record<string, string> = {
      github: 'https://github.com/login/oauth/authorize',
      slack: 'https://slack.com/oauth_authorize',
      notion: 'https://api.notion.com/v1/oauth/authorize',
    };

    const url = `${baseUrls[serverType]}?${params.toString()}`;

    return { url, state };
  }

  /**
   * Verify OAuth state token
   */
  static verifyState(state: string): OAuthState | null {
    const stored = oauthStateStore.get(state);

    if (!stored) {
      return null;
    }

    // Check expiration
    if (new Date() > stored.expiresAt) {
      oauthStateStore.delete(state);
      return null;
    }

    return stored;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    serverType: 'github' | 'slack' | 'notion',
    code: string,
  ): Promise<OAuthToken> {
    const config = OAUTH_CONFIGS[serverType];

    // Build token exchange request
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    });

    const tokenUrls: Record<string, string> = {
      github: 'https://github.com/login/oauth/access_token',
      slack: 'https://slack.com/api/oauth.v2.access',
      notion: 'https://api.notion.com/v1/oauth/token',
    };

    try {
      const response = await fetch(tokenUrls[serverType], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        throw new Error(`OAuth token exchange failed: ${data.error || 'Unknown error'}`);
      }

      // Parse response based on server type
      let token: OAuthToken;

      switch (serverType) {
        case 'github':
          token = {
            accessToken: data.access_token,
            tokenType: data.token_type || 'bearer',
          };
          break;

        case 'slack':
          token = {
            accessToken: data.access_token,
            tokenType: 'bearer',
            expiresIn: data.expires_in,
          };
          break;

        case 'notion':
          token = {
            accessToken: data.access_token,
            tokenType: data.token_type || 'bearer',
            expiresIn: data.expires_in,
          };
          break;

        default:
          throw new Error(`Unknown server type: ${serverType}`);
      }

      // Set expiration date if provided
      if (token.expiresIn) {
        token.expiresAt = new Date(Date.now() + token.expiresIn * 1000);
      }

      return token;
    } catch (error: any) {
      throw new Error(`Failed to exchange OAuth code: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(
    serverType: 'github' | 'slack' | 'notion',
    refreshToken: string,
  ): Promise<OAuthToken> {
    const config = OAUTH_CONFIGS[serverType];

    // GitHub doesn't support refresh tokens in the traditional sense
    if (serverType === 'github') {
      throw new Error('GitHub OAuth does not support token refresh');
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const tokenUrls: Record<string, string> = {
      slack: 'https://slack.com/api/oauth.v2.access',
      notion: 'https://api.notion.com/v1/oauth/token',
    };

    try {
      const response = await fetch(tokenUrls[serverType] || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${data.error || 'Unknown error'}`);
      }

      const token: OAuthToken = {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in,
      };

      if (token.expiresIn) {
        token.expiresAt = new Date(Date.now() + token.expiresIn * 1000);
      }

      return token;
    } catch (error: any) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Revoke access token
   */
  static async revokeToken(
    serverType: 'github' | 'slack' | 'notion',
    token: string,
  ): Promise<boolean> {
    const config = OAUTH_CONFIGS[serverType];

    const revokeUrls: Record<string, string> = {
      github: 'https://api.github.com/applications/{client_id}/token',
      slack: 'https://slack.com/api/auth.revoke',
      notion: 'https://api.notion.com/v1/oauth/revoke',
    };

    try {
      let url = revokeUrls[serverType];
      if (serverType === 'github') {
        url = url.replace('{client_id}', config.clientId);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({
          token,
        }).toString(),
      });

      return response.ok;
    } catch (error: any) {
      console.error(`Failed to revoke token: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: OAuthToken): boolean {
    if (!token.expiresAt) {
      return false;
    }
    return new Date() > token.expiresAt;
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiration)
   */
  static shouldRefreshToken(token: OAuthToken): boolean {
    if (!token.expiresAt) {
      return false;
    }
    const fiveMinutesFromNow = new Date(Date.now() + 300000);
    return new Date() > fiveMinutesFromNow && new Date() < token.expiresAt;
  }
}
