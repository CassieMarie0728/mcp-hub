/**
 * Diff Visualizer
 * Visualizes differences between macro versions with side-by-side comparison
 */
export class DiffVisualizer {
  /**
   * Generate side-by-side diff
   */
  static generateSideBySideDiff(fromContent: any, toContent: any): SideBySideDiff {
    const fromLines = this.contentToLines(fromContent);
    const toLines = this.contentToLines(toContent);

    const diff = this.computeLineDiff(fromLines, toLines);

    return {
      from: {
        lines: fromLines,
        lineCount: fromLines.length,
      },
      to: {
        lines: toLines,
        lineCount: toLines.length,
      },
      diff,
      summary: {
        added: diff.filter((d) => d.type === 'add').length,
        removed: diff.filter((d) => d.type === 'remove').length,
        modified: diff.filter((d) => d.type === 'modify').length,
      },
    };
  }

  /**
   * Convert content to lines
   */
  private static contentToLines(content: any): string[] {
    if (typeof content === 'string') {
      return content.split('\n');
    }

    const json = JSON.stringify(content, null, 2);
    return json.split('\n');
  }

  /**
   * Compute line-by-line diff using Myers algorithm
   */
  private static computeLineDiff(from: string[], to: string[]): LineDiff[] {
    const diffs: LineDiff[] = [];
    const matrix = this.computeEditDistance(from, to);
    const path = this.traceback(matrix, from, to);

    for (const [i, j, type] of path) {
      if (type === 'match') {
        diffs.push({
          type: 'match',
          lineNumber: i + 1,
          content: from[i],
        });
      } else if (type === 'insert') {
        diffs.push({
          type: 'add',
          lineNumber: j + 1,
          content: to[j],
        });
      } else if (type === 'delete') {
        diffs.push({
          type: 'remove',
          lineNumber: i + 1,
          content: from[i],
        });
      } else if (type === 'replace') {
        diffs.push({
          type: 'remove',
          lineNumber: i + 1,
          content: from[i],
        });
        diffs.push({
          type: 'add',
          lineNumber: j + 1,
          content: to[j],
        });
      }
    }

    return diffs;
  }

  /**
   * Compute edit distance matrix
   */
  private static computeEditDistance(from: string[], to: string[]): number[][] {
    const m = from.length;
    const n = to.length;
    const matrix: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) matrix[i][0] = i;
    for (let j = 0; j <= n; j++) matrix[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (from[i - 1] === to[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
        }
      }
    }

    return matrix;
  }

  /**
   * Traceback to find the actual diff
   */
  private static traceback(
    matrix: number[][],
    from: string[],
    to: string[]
  ): Array<[number, number, string]> {
    const path: Array<[number, number, string]> = [];
    let i = from.length;
    let j = to.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && from[i - 1] === to[j - 1]) {
        path.unshift([i - 1, j - 1, 'match']);
        i--;
        j--;
      } else if (j > 0 && (i === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
        path.unshift([i, j - 1, 'insert']);
        j--;
      } else if (i > 0 && (j === 0 || matrix[i - 1][j] < matrix[i][j - 1])) {
        path.unshift([i - 1, j, 'delete']);
        i--;
      } else {
        path.unshift([i - 1, j - 1, 'replace']);
        i--;
        j--;
      }
    }

    return path;
  }

  /**
   * Generate unified diff format
   */
  static generateUnifiedDiff(fromContent: any, toContent: any, context: number = 3): string {
    const fromLines = this.contentToLines(fromContent);
    const toLines = this.contentToLines(toContent);
    const diff = this.computeLineDiff(fromLines, toLines);

    let result = '';
    let fromLineNum = 1;
    let toLineNum = 1;

    for (const line of diff) {
      if (line.type === 'match') {
        result += ` ${line.content}\n`;
        fromLineNum++;
        toLineNum++;
      } else if (line.type === 'remove') {
        result += `-${line.content}\n`;
        fromLineNum++;
      } else if (line.type === 'add') {
        result += `+${line.content}\n`;
        toLineNum++;
      }
    }

    return result;
  }

  /**
   * Generate HTML diff
   */
  static generateHtmlDiff(fromContent: any, toContent: any): string {
    const fromLines = this.contentToLines(fromContent);
    const toLines = this.contentToLines(toContent);
    const diff = this.computeLineDiff(fromLines, toLines);

    let html = '<div class="diff-container">';
    html += '<table class="diff-table"><tbody>';

    let fromLineNum = 1;
    let toLineNum = 1;

    for (const line of diff) {
      if (line.type === 'match') {
        html += `<tr class="diff-match"><td class="line-num">${fromLineNum}</td><td class="line-num">${toLineNum}</td><td class="line-content">${this.escapeHtml(line.content)}</td></tr>`;
        fromLineNum++;
        toLineNum++;
      } else if (line.type === 'remove') {
        html += `<tr class="diff-remove"><td class="line-num">${fromLineNum}</td><td class="line-num"></td><td class="line-content">- ${this.escapeHtml(line.content)}</td></tr>`;
        fromLineNum++;
      } else if (line.type === 'add') {
        html += `<tr class="diff-add"><td class="line-num"></td><td class="line-num">${toLineNum}</td><td class="line-content">+ ${this.escapeHtml(line.content)}</td></tr>`;
        toLineNum++;
      }
    }

    html += '</tbody></table></div>';

    return html;
  }

  /**
   * Escape HTML
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Generate inline diff
   */
  static generateInlineDiff(fromContent: any, toContent: any): InlineDiff[] {
    const fromStr = typeof fromContent === 'string' ? fromContent : JSON.stringify(fromContent);
    const toStr = typeof toContent === 'string' ? toContent : JSON.stringify(toContent);

    const diffs: InlineDiff[] = [];
    let fromIdx = 0;
    let toIdx = 0;

    while (fromIdx < fromStr.length || toIdx < toStr.length) {
      if (fromStr[fromIdx] === toStr[toIdx]) {
        diffs.push({
          type: 'match',
          content: fromStr[fromIdx],
        });
        fromIdx++;
        toIdx++;
      } else {
        let removed = '';
        while (fromIdx < fromStr.length && fromStr[fromIdx] !== toStr[toIdx]) {
          removed += fromStr[fromIdx];
          fromIdx++;
        }

        let added = '';
        while (toIdx < toStr.length && fromStr[fromIdx] !== toStr[toIdx]) {
          added += toStr[toIdx];
          toIdx++;
        }

        if (removed) {
          diffs.push({
            type: 'remove',
            content: removed,
          });
        }

        if (added) {
          diffs.push({
            type: 'add',
            content: added,
          });
        }
      }
    }

    return diffs;
  }

  /**
   * Calculate diff statistics
   */
  static calculateDiffStats(fromContent: any, toContent: any): DiffStats {
    const fromLines = this.contentToLines(fromContent);
    const toLines = this.contentToLines(toContent);
    const diff = this.computeLineDiff(fromLines, toLines);

    const stats: DiffStats = {
      totalChanges: 0,
      additions: 0,
      deletions: 0,
      modifications: 0,
      similarity: 0,
      complexity: 0,
    };

    for (const line of diff) {
      if (line.type === 'add') {
        stats.additions++;
        stats.totalChanges++;
      } else if (line.type === 'remove') {
        stats.deletions++;
        stats.totalChanges++;
      } else if (line.type === 'modify') {
        stats.modifications++;
        stats.totalChanges++;
      }
    }

    // Calculate similarity
    const totalLines = Math.max(fromLines.length, toLines.length);
    const matchedLines = diff.filter((d) => d.type === 'match').length;
    stats.similarity = totalLines > 0 ? (matchedLines / totalLines) * 100 : 100;

    // Calculate complexity (0-100)
    stats.complexity = Math.min(100, (stats.totalChanges / totalLines) * 100);

    return stats;
  }

  /**
   * Highlight differences
   */
  static highlightDifferences(fromContent: any, toContent: any): HighlightedDiff {
    const fromStr = typeof fromContent === 'string' ? fromContent : JSON.stringify(fromContent);
    const toStr = typeof toContent === 'string' ? toContent : JSON.stringify(toContent);

    const fromHighlighted = this.highlightString(fromStr, toStr);
    const toHighlighted = this.highlightString(toStr, fromStr);

    return {
      from: fromHighlighted,
      to: toHighlighted,
    };
  }

  /**
   * Highlight string with differences
   */
  private static highlightString(str: string, compareStr: string): string {
    let result = '';
    let compareIdx = 0;

    for (let i = 0; i < str.length; i++) {
      if (compareIdx < compareStr.length && str[i] === compareStr[compareIdx]) {
        result += str[i];
        compareIdx++;
      } else {
        result += `<mark>${str[i]}</mark>`;
      }
    }

    return result;
  }
}

/**
 * Side-by-side diff
 */
export interface SideBySideDiff {
  from: {
    lines: string[];
    lineCount: number;
  };
  to: {
    lines: string[];
    lineCount: number;
  };
  diff: LineDiff[];
  summary: {
    added: number;
    removed: number;
    modified: number;
  };
}

/**
 * Line diff
 */
export interface LineDiff {
  type: 'match' | 'add' | 'remove' | 'modify';
  lineNumber: number;
  content: string;
}

/**
 * Inline diff
 */
export interface InlineDiff {
  type: 'match' | 'add' | 'remove';
  content: string;
}

/**
 * Diff statistics
 */
export interface DiffStats {
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
  similarity: number;
  complexity: number;
}

/**
 * Highlighted diff
 */
export interface HighlightedDiff {
  from: string;
  to: string;
}
