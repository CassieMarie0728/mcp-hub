/**
 * Macro Sharing & Invitation System
 * Handles sharing macros with users and managing invitations
 */

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface MacroInvitation {
  id: string;
  macroId: string;
  invitedBy: string;
  invitedEmail: string;
  permissionLevel: string;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  message?: string;
}

export class MacroSharingSystem {
  private invitations: Map<string, MacroInvitation[]> = new Map();
  private shareLinks: Map<string, ShareLinkData[]> = new Map();

  inviteUser(
    macroId: string,
    invitedBy: string,
    invitedEmail: string,
    permissionLevel: string,
    options: InvitationOptions = {}
  ): MacroInvitation {
    const invitation: MacroInvitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      macroId,
      invitedBy,
      invitedEmail,
      permissionLevel,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: options.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      acceptedAt: null,
      declinedAt: null,
      message: options.message,
    };

    if (!this.invitations.has(macroId)) {
      this.invitations.set(macroId, []);
    }

    this.invitations.get(macroId)!.push(invitation);
    return invitation;
  }

  getPendingInvitations(email: string): MacroInvitation[] {
    const pending: MacroInvitation[] = [];

    for (const invitations of this.invitations.values()) {
      invitations.forEach((inv) => {
        if (inv.invitedEmail === email && inv.status === 'pending' && new Date() < inv.expiresAt) {
          pending.push(inv);
        }
      });
    }

    return pending;
  }

  acceptInvitation(invitationId: string, userId: string): MacroInvitation | null {
    for (const invitations of this.invitations.values()) {
      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (invitation) {
        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        return invitation;
      }
    }

    return null;
  }

  declineInvitation(invitationId: string): MacroInvitation | null {
    for (const invitations of this.invitations.values()) {
      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (invitation) {
        invitation.status = 'declined';
        invitation.declinedAt = new Date();
        return invitation;
      }
    }

    return null;
  }

  getMacroInvitations(macroId: string): MacroInvitation[] {
    return this.invitations.get(macroId) || [];
  }

  createShareLink(
    macroId: string,
    createdBy: string,
    permissionLevel: string,
    options: ShareLinkOptions = {}
  ): ShareLinkData {
    const link: ShareLinkData = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      token: this.generateToken(),
      macroId,
      createdBy,
      permissionLevel,
      createdAt: new Date(),
      expiresAt: options.expiresAt || null,
      maxUses: options.maxUses || null,
      usedCount: 0,
      active: true,
      password: options.password || null,
    };

    if (!this.shareLinks.has(macroId)) {
      this.shareLinks.set(macroId, []);
    }

    this.shareLinks.get(macroId)!.push(link);
    return link;
  }

  validateShareLink(token: string, password?: string): ShareLinkValidation {
    for (const links of this.shareLinks.values()) {
      const link = links.find((l) => l.token === token);
      if (link) {
        if (!link.active) {
          return { valid: false, reason: 'Link is inactive' };
        }

        if (link.expiresAt && new Date() > link.expiresAt) {
          return { valid: false, reason: 'Link has expired' };
        }

        if (link.maxUses && link.usedCount >= link.maxUses) {
          return { valid: false, reason: 'Link usage limit reached' };
        }

        if (link.password && link.password !== password) {
          return { valid: false, reason: 'Invalid password' };
        }

        return { valid: true, link };
      }
    }

    return { valid: false, reason: 'Link not found' };
  }

  useShareLink(token: string): boolean {
    for (const links of this.shareLinks.values()) {
      const link = links.find((l) => l.token === token);
      if (link) {
        link.usedCount++;
        return true;
      }
    }

    return false;
  }

  revokeShareLink(token: string): boolean {
    for (const links of this.shareLinks.values()) {
      const link = links.find((l) => l.token === token);
      if (link) {
        link.active = false;
        return true;
      }
    }

    return false;
  }

  getMacroShareLinks(macroId: string): ShareLinkData[] {
    return this.shareLinks.get(macroId) || [];
  }

  getActiveShareLinks(macroId: string): ShareLinkData[] {
    const links = this.shareLinks.get(macroId) || [];
    return links.filter((l) => l.active && (!l.expiresAt || new Date() < l.expiresAt));
  }

  extendShareLink(token: string, newExpiryDate: Date): boolean {
    for (const links of this.shareLinks.values()) {
      const link = links.find((l) => l.token === token);
      if (link) {
        link.expiresAt = newExpiryDate;
        return true;
      }
    }

    return false;
  }

  updateShareLinkPermission(token: string, newPermissionLevel: string): boolean {
    for (const links of this.shareLinks.values()) {
      const link = links.find((l) => l.token === token);
      if (link) {
        link.permissionLevel = newPermissionLevel;
        return true;
      }
    }

    return false;
  }

  getSharingStats(macroId: string): SharingStats {
    const invitations = this.invitations.get(macroId) || [];
    const links = this.shareLinks.get(macroId) || [];

    return {
      totalInvitations: invitations.length,
      pendingInvitations: invitations.filter((i) => i.status === 'pending').length,
      acceptedInvitations: invitations.filter((i) => i.status === 'accepted').length,
      declinedInvitations: invitations.filter((i) => i.status === 'declined').length,
      totalShareLinks: links.length,
      activeShareLinks: links.filter((l) => l.active).length,
      totalLinkUses: links.reduce((sum, l) => sum + l.usedCount, 0),
    };
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2, 16).toUpperCase();
  }
}

export interface InvitationOptions {
  expiresAt?: Date;
  message?: string;
}

export interface ShareLinkData {
  id: string;
  token: string;
  macroId: string;
  createdBy: string;
  permissionLevel: string;
  createdAt: Date;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  password: string | null;
}

export interface ShareLinkOptions {
  expiresAt?: Date;
  maxUses?: number;
  password?: string;
}

export interface ShareLinkValidation {
  valid: boolean;
  reason?: string;
  link?: ShareLinkData;
}

export interface SharingStats {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  declinedInvitations: number;
  totalShareLinks: number;
  activeShareLinks: number;
  totalLinkUses: number;
}
