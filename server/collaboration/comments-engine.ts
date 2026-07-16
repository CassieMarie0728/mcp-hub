/**
 * Macro Collaboration Comments Engine
 * Enables threaded discussions on specific lines in macros
 */
export class MacroCommentsEngine {
  private comments: Map<string, Comment[]> = new Map();
  private threads: Map<string, CommentThread> = new Map();
  private reactions: Map<string, Reaction[]> = new Map();
  private mentions: Map<string, Mention[]> = new Map();

  /**
   * Add comment to macro at specific line
   */
  addComment(
    macroId: string,
    lineNumber: number,
    userId: string,
    content: string,
    parentCommentId?: string,
  ): Comment {
    const commentId = `${macroId}:${Date.now()}:${Math.random()}`;

    const comment: Comment = {
      id: commentId,
      macroId,
      lineNumber,
      userId,
      content,
      parentCommentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      reactions: [],
      mentions: this.extractMentions(content),
    };

    // Add to comments list
    const key = `${macroId}:${lineNumber}`;
    const lineComments = this.comments.get(key) || [];
    lineComments.push(comment);
    this.comments.set(key, lineComments);

    // Create or update thread
    if (parentCommentId) {
      const thread = this.threads.get(parentCommentId);
      if (thread) {
        thread.replies.push(commentId);
        thread.lastReplyAt = new Date();
      }
    } else {
      const thread: CommentThread = {
        id: commentId,
        macroId,
        lineNumber,
        rootCommentId: commentId,
        replies: [],
        createdAt: new Date(),
        resolved: false,
        participants: new Set([userId]),
      };
      this.threads.set(commentId, thread);
    }

    return comment;
  }

  /**
   * Get comments for specific line
   */
  getCommentsForLine(macroId: string, lineNumber: number): Comment[] {
    const key = `${macroId}:${lineNumber}`;
    return this.comments.get(key) || [];
  }

  /**
   * Get all comments for macro
   */
  getAllComments(macroId: string): Comment[] {
    const allComments: Comment[] = [];

    this.comments.forEach((comments, key) => {
      if (key.startsWith(macroId)) {
        allComments.push(...comments);
      }
    });

    return allComments;
  }

  /**
   * Get comment thread
   */
  getCommentThread(commentId: string): CommentThread | null {
    return this.threads.get(commentId) || null;
  }

  /**
   * Get thread replies
   */
  getThreadReplies(commentId: string): Comment[] {
    const thread = this.threads.get(commentId);
    if (!thread) return [];

    const replies: Comment[] = [];

    thread.replies.forEach((replyId) => {
      this.comments.forEach((comments) => {
        const reply = comments.find((c) => c.id === replyId);
        if (reply) replies.push(reply);
      });
    });

    return replies;
  }

  /**
   * Update comment
   */
  updateComment(commentId: string, content: string): boolean {
    let found = false;

    this.comments.forEach((comments) => {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        comment.content = content;
        comment.updatedAt = new Date();
        comment.mentions = this.extractMentions(content);
        found = true;
      }
    });

    return found;
  }

  /**
   * Delete comment
   */
  deleteComment(commentId: string): boolean {
    let found = false;

    this.comments.forEach((comments) => {
      const index = comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        comments.splice(index, 1);
        found = true;
      }
    });

    // Remove thread if it's a root comment
    if (this.threads.has(commentId)) {
      this.threads.delete(commentId);
    }

    return found;
  }

  /**
   * Resolve comment thread
   */
  resolveThread(commentId: string): boolean {
    const thread = this.threads.get(commentId);
    if (!thread) return false;

    thread.resolved = true;

    // Mark all comments in thread as resolved
    this.comments.forEach((comments) => {
      comments.forEach((comment) => {
        if (comment.id === commentId || thread.replies.includes(comment.id)) {
          comment.resolved = true;
        }
      });
    });

    return true;
  }

  /**
   * Reopen comment thread
   */
  reopenThread(commentId: string): boolean {
    const thread = this.threads.get(commentId);
    if (!thread) return false;

    thread.resolved = false;

    // Mark all comments in thread as unresolved
    this.comments.forEach((comments) => {
      comments.forEach((comment) => {
        if (comment.id === commentId || thread.replies.includes(comment.id)) {
          comment.resolved = false;
        }
      });
    });

    return true;
  }

  /**
   * Add reaction to comment
   */
  addReaction(commentId: string, userId: string, emoji: string): boolean {
    let found = false;

    this.comments.forEach((comments) => {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        const existingReaction = comment.reactions.find(
          (r) => r.userId === userId && r.emoji === emoji,
        );

        if (!existingReaction) {
          comment.reactions.push({
            userId,
            emoji,
            createdAt: new Date(),
          });
        }

        found = true;
      }
    });

    return found;
  }

  /**
   * Remove reaction from comment
   */
  removeReaction(commentId: string, userId: string, emoji: string): boolean {
    let found = false;

    this.comments.forEach((comments) => {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        const index = comment.reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);

        if (index !== -1) {
          comment.reactions.splice(index, 1);
          found = true;
        }
      }
    });

    return found;
  }

  /**
   * Get reaction summary
   */
  getReactionSummary(commentId: string): Map<string, number> {
    const summary = new Map<string, number>();

    this.comments.forEach((comments) => {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        comment.reactions.forEach((reaction) => {
          const count = summary.get(reaction.emoji) || 0;
          summary.set(reaction.emoji, count + 1);
        });
      }
    });

    return summary;
  }

  /**
   * Extract mentions from content
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = content.matchAll(mentionRegex);
    return Array.from(matches).map((match) => match[1]);
  }

  /**
   * Get unresolved comments
   */
  getUnresolvedComments(macroId: string): Comment[] {
    return this.getAllComments(macroId).filter((c) => !c.resolved);
  }

  /**
   * Get resolved comments
   */
  getResolvedComments(macroId: string): Comment[] {
    return this.getAllComments(macroId).filter((c) => c.resolved);
  }

  /**
   * Get comments by user
   */
  getCommentsByUser(userId: string): Comment[] {
    const userComments: Comment[] = [];

    this.comments.forEach((comments) => {
      userComments.push(...comments.filter((c) => c.userId === userId));
    });

    return userComments;
  }

  /**
   * Get comments mentioning user
   */
  getCommentsMentioningUser(userId: string): Comment[] {
    const mentionedComments: Comment[] = [];

    this.comments.forEach((comments) => {
      mentionedComments.push(...comments.filter((c) => c.mentions.includes(userId)));
    });

    return mentionedComments;
  }

  /**
   * Get comment statistics
   */
  getCommentStatistics(macroId: string): CommentStatistics {
    const allComments = this.getAllComments(macroId);
    const unresolved = allComments.filter((c) => !c.resolved);
    const resolved = allComments.filter((c) => c.resolved);

    const commentsByLine = new Map<number, number>();
    allComments.forEach((comment) => {
      const count = commentsByLine.get(comment.lineNumber) || 0;
      commentsByLine.set(comment.lineNumber, count + 1);
    });

    const mostCommentedLine = Array.from(commentsByLine.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      totalComments: allComments.length,
      unresolvedComments: unresolved.length,
      resolvedComments: resolved.length,
      totalThreads: Array.from(this.threads.values()).filter((t) => t.macroId === macroId).length,
      mostCommentedLine: mostCommentedLine ? mostCommentedLine[0] : -1,
      commentsByLine: Object.fromEntries(commentsByLine),
      averageReactionsPerComment:
        allComments.length > 0
          ? allComments.reduce((sum, c) => sum + c.reactions.length, 0) / allComments.length
          : 0,
    };
  }

  /**
   * Export comments as JSON
   */
  exportComments(macroId: string): string {
    const allComments = this.getAllComments(macroId);
    const threads = Array.from(this.threads.values()).filter((t) => t.macroId === macroId);

    return JSON.stringify(
      {
        comments: allComments,
        threads,
        statistics: this.getCommentStatistics(macroId),
      },
      null,
      2,
    );
  }

  /**
   * Import comments from JSON
   */
  importComments(macroId: string, jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.comments && Array.isArray(data.comments)) {
        data.comments.forEach((comment: Comment) => {
          const key = `${comment.macroId}:${comment.lineNumber}`;
          const lineComments = this.comments.get(key) || [];
          lineComments.push(comment);
          this.comments.set(key, lineComments);
        });
      }

      if (data.threads && Array.isArray(data.threads)) {
        data.threads.forEach((thread: CommentThread) => {
          this.threads.set(thread.id, thread);
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get activity feed for macro
   */
  getActivityFeed(macroId: string, limit: number = 20): CommentActivity[] {
    const activities: CommentActivity[] = [];

    this.getAllComments(macroId).forEach((comment) => {
      activities.push({
        type: 'comment_added',
        commentId: comment.id,
        userId: comment.userId,
        lineNumber: comment.lineNumber,
        timestamp: comment.createdAt,
      });

      if (comment.updatedAt > comment.createdAt) {
        activities.push({
          type: 'comment_edited',
          commentId: comment.id,
          userId: comment.userId,
          lineNumber: comment.lineNumber,
          timestamp: comment.updatedAt,
        });
      }
    });

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  /**
   * Get all threads for macro
   */
  getAllThreads(macroId: string): CommentThread[] {
    return Array.from(this.threads.values()).filter((t) => t.macroId === macroId);
  }
}

/**
 * Comment
 */
export interface Comment {
  id: string;
  macroId: string;
  lineNumber: number;
  userId: string;
  content: string;
  parentCommentId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  reactions: CommentReaction[];
  mentions: string[];
}

/**
 * Comment reaction
 */
export interface CommentReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

/**
 * Comment thread
 */
export interface CommentThread {
  id: string;
  macroId: string;
  lineNumber: number;
  rootCommentId: string;
  replies: string[];
  createdAt: Date;
  resolved: boolean;
  participants: Set<string>;
  lastReplyAt?: Date;
}

/**
 * Comment statistics
 */
export interface CommentStatistics {
  totalComments: number;
  unresolvedComments: number;
  resolvedComments: number;
  totalThreads: number;
  mostCommentedLine: number;
  commentsByLine: Record<number, number>;
  averageReactionsPerComment: number;
}

/**
 * Comment activity
 */
export interface CommentActivity {
  type: 'comment_added' | 'comment_edited' | 'comment_resolved' | 'comment_reopened';
  commentId: string;
  userId: string;
  lineNumber: number;
  timestamp: Date;
}

/**
 * Mention
 */
export interface Mention {
  userId: string;
  commentId: string;
  createdAt: Date;
}

/**
 * Reaction
 */
export interface Reaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}
