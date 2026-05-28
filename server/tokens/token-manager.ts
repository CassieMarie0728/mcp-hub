/**
 * Secure Token Manager
 * Handles encryption, storage, and lifecycle management of API tokens
 */

import crypto from 'crypto';

export interface TokenMetadata {
  id: string;
  serverId: string;
  serverType: string;
  name: string;
  maskedToken: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  scopes?: string[];
}

export interface TokenCreateInput {
  serverId: string;
  serverType: string;
  name: string;
  token: string;
  expiresAt?: Date;
  scopes?: string[];
}

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// In-memory token store (would be replaced with database)
const tokenStore = new Map<string, {
  encrypted: string;
  iv: string;
  authTag: string;
  metadata: TokenMetadata;
}>();

export class TokenManager {
  /**
   * Encrypt a token for secure storage
   */
  private static encryptToken(token: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt a stored token
   */
  private static decryptToken(
    encrypted: string,
    iv: string,
    authTag: string
  ): string {
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create a masked version of token for display (show last 4 chars)
   */
  private static maskToken(token: string): string {
    if (token.length <= 4) return '••••';
    return '••••' + token.slice(-4);
  }

  /**
   * Store a new token securely
   */
  static async storeToken(input: TokenCreateInput): Promise<TokenMetadata> {
    const { encrypted, iv, authTag } = this.encryptToken(input.token);
    const tokenId = crypto.randomUUID();
    const maskedToken = this.maskToken(input.token);

    const metadata: TokenMetadata = {
      id: tokenId,
      serverId: input.serverId,
      serverType: input.serverType,
      name: input.name,
      maskedToken,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
      isActive: true,
      scopes: input.scopes,
    };

    tokenStore.set(tokenId, {
      encrypted,
      iv,
      authTag,
      metadata,
    });

    return metadata;
  }

  /**
   * Retrieve a token by ID
   */
  static async getToken(tokenId: string): Promise<string | null> {
    const stored = tokenStore.get(tokenId);
    if (!stored) return null;

    // Update last used timestamp
    stored.metadata.lastUsedAt = new Date();

    return this.decryptToken(stored.encrypted, stored.iv, stored.authTag);
  }

  /**
   * Get token metadata without decrypting
   */
  static async getTokenMetadata(tokenId: string): Promise<TokenMetadata | null> {
    const stored = tokenStore.get(tokenId);
    return stored?.metadata || null;
  }

  /**
   * List all tokens for a server
   */
  static async listServerTokens(serverId: string): Promise<TokenMetadata[]> {
    const results: TokenMetadata[] = [];
    for (const stored of tokenStore.values()) {
      if (stored.metadata.serverId === serverId && stored.metadata.isActive) {
        results.push(stored.metadata);
      }
    }
    return results;
  }

  /**
   * Revoke a token
   */
  static async revokeToken(tokenId: string): Promise<boolean> {
    const stored = tokenStore.get(tokenId);
    if (!stored) return false;
    stored.metadata.isActive = false;
    return true;
  }

  /**
   * Rotate a token (revoke old, store new)
   */
  static async rotateToken(tokenId: string, newToken: string): Promise<TokenMetadata | null> {
    const oldToken = await this.getTokenMetadata(tokenId);
    if (!oldToken) return null;

    // Revoke old token
    await this.revokeToken(tokenId);

    // Store new token
    return this.storeToken({
      serverId: oldToken.serverId,
      serverType: oldToken.serverType,
      name: `${oldToken.name} (rotated)`,
      token: newToken,
      scopes: oldToken.scopes,
    });
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(metadata: TokenMetadata): boolean {
    if (!metadata.expiresAt) return false;
    return new Date() > metadata.expiresAt;
  }

  /**
   * Get all expired tokens
   */
  static async getExpiredTokens(): Promise<TokenMetadata[]> {
    const results: TokenMetadata[] = [];
    for (const stored of tokenStore.values()) {
      if (stored.metadata.isActive && this.isTokenExpired(stored.metadata)) {
        results.push(stored.metadata);
      }
    }
    return results;
  }

  /**
   * Audit log token access
   */
  static async logTokenAccess(tokenId: string, action: string, success: boolean): Promise<void> {
    console.log(`[TOKEN AUDIT] ${tokenId}: ${action} - ${success ? 'SUCCESS' : 'FAILED'}`);
  }

  /**
   * Validate token scopes
   */
  static validateScopes(tokenScopes: string[] | undefined, requiredScopes: string[]): boolean {
    if (!tokenScopes) return false;
    return requiredScopes.every((scope: string) => tokenScopes.includes(scope));
  }

  /**
   * Get token statistics
   */
  static async getTokenStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    byServer: Record<string, number>;
  }> {
    let total = 0;
    let active = 0;
    const byServer: Record<string, number> = {};

    for (const stored of tokenStore.values()) {
      total++;
      if (stored.metadata.isActive) {
        active++;
        byServer[stored.metadata.serverType] = (byServer[stored.metadata.serverType] || 0) + 1;
      }
    }

    const expired = await this.getExpiredTokens();

    return {
      total,
      active,
      expired: expired.length,
      byServer,
    };
  }

  /**
   * Clear all tokens (for testing)
   */
  static async clearAllTokens(): Promise<void> {
    tokenStore.clear();
  }
}

export default TokenManager;
