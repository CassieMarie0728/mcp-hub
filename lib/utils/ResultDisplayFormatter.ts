import { ResultType } from '../types/result-type';

/**
 * Formatted result for display
 */
export interface FormattedResult {
  format: ResultType;
  content: string;
  raw: any;
  metadata: {
    size: number;
    isLarge: boolean;
    canDownload: boolean;
    canCopy: boolean;
  };
}

/**
 * Result display formatter utility
 */
export class ResultDisplayFormatter {
  private static readonly MAX_DISPLAY_SIZE = 1024 * 1024; // 1MB
  private static readonly LARGE_THRESHOLD = 100 * 1024; // 100KB

  /**
   * Format result for display based on type
   */
  static formatResult(result: any, resultType: ResultType): FormattedResult {
    let content = '';
    let canDownload = false;
    let canCopy = true;

    switch (resultType) {
      case ResultType.TEXT:
        content = this.formatText(result);
        break;

      case ResultType.JSON:
        content = this.formatJson(result);
        break;

      case ResultType.MARKDOWN:
        content = this.formatMarkdown(result);
        break;

      case ResultType.HTML:
        content = this.formatHtml(result);
        break;

      case ResultType.CODE_BLOCK:
        content = this.formatCodeBlock(result);
        break;

      case ResultType.TABLE:
        content = this.formatTable(result);
        break;

      case ResultType.TREE:
        content = this.formatTree(result);
        break;

      case ResultType.IMAGE:
        content = this.formatImage(result);
        canDownload = true;
        canCopy = false;
        break;

      case ResultType.BINARY:
        content = this.formatBinary(result);
        canDownload = true;
        canCopy = false;
        break;

      case ResultType.STREAM:
        content = this.formatStream(result);
        break;

      case ResultType.MIXED:
        content = this.formatMixed(result);
        break;

      default:
        content = String(result);
    }

    const size = Buffer.byteLength(content, 'utf8');
    const isLarge = size > this.LARGE_THRESHOLD;

    return {
      format: resultType,
      content: isLarge ? content.substring(0, this.MAX_DISPLAY_SIZE) : content,
      raw: result,
      metadata: {
        size,
        isLarge,
        canDownload,
        canCopy,
      },
    };
  }

  /**
   * Format as plain text
   */
  private static formatText(result: any): string {
    if (typeof result === 'string') {
      return result;
    }
    return String(result);
  }

  /**
   * Format as pretty JSON
   */
  private static formatJson(result: any): string {
    try {
      if (typeof result === 'string') {
        // Try to parse and re-format
        const parsed = JSON.parse(result);
        return JSON.stringify(parsed, null, 2);
      }
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return String(result);
    }
  }

  /**
   * Format as markdown
   */
  private static formatMarkdown(result: any): string {
    if (typeof result === 'string') {
      return result;
    }
    return String(result);
  }

  /**
   * Format as HTML
   */
  private static formatHtml(result: any): string {
    if (typeof result === 'string') {
      return result;
    }
    return String(result);
  }

  /**
   * Format as code block
   */
  private static formatCodeBlock(result: any): string {
    let code = '';

    if (typeof result === 'string') {
      code = result;
    } else if (typeof result === 'object') {
      code = JSON.stringify(result, null, 2);
    } else {
      code = String(result);
    }

    // Detect language from content
    const language = this.detectLanguage(code);
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  /**
   * Format as table
   */
  private static formatTable(result: any): string {
    if (!Array.isArray(result)) {
      return String(result);
    }
    if (result.length === 0) {
      return '[]';
    }

    // Get all keys from first object
    const firstItem = result[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      return String(result);
    }

    const keys = Object.keys(firstItem);
    if (keys.length === 0) {
      return String(result);
    }

    // Build markdown table
    const header = `| ${keys.join(' | ')} |`;
    const separator = `| ${keys.map(() => '---').join(' | ')} |`;
    const rows = result
      .map((item) => {
        const values = keys.map((key) => {
          const value = item[key];
          return this.escapeTableCell(value);
        });
        return `| ${values.join(' | ')} |`;
      })
      .join('\n');

    return `${header}\n${separator}\n${rows}`;
  }

  /**
   * Format as tree structure
   */
  private static formatTree(result: any, indent: number = 0): string {
    const prefix = '  '.repeat(indent);

    if (result === null || result === undefined) {
      return `${prefix}null`;
    }

    if (typeof result === 'string') {
      return `${prefix}"${result}"`;
    }

    if (typeof result === 'number' || typeof result === 'boolean') {
      return `${prefix}${result}`;
    }

    if (Array.isArray(result)) {
      if (result.length === 0) {
        return `${prefix}[]`;
      }

      let output = `${prefix}[\n`;
      result.forEach((item, index) => {
        output += this.formatTree(item, indent + 1);
        if (index < result.length - 1) {
          output += ',';
        }
        output += '\n';
      });
      output += `${prefix}]`;
      return output;
    }

    if (typeof result === 'object') {
      const keys = Object.keys(result);
      if (keys.length === 0) {
        return `${prefix}{}`;
      }

      let output = `${prefix}{\n`;
      keys.forEach((key, index) => {
        output += `${prefix}  "${key}": `;
        const value = result[key];

        if (typeof value === 'object' && value !== null) {
          output += '\n' + this.formatTree(value, indent + 2);
        } else {
          output += this.formatTree(value, 0).trim();
        }

        if (index < keys.length - 1) {
          output += ',';
        }
        output += '\n';
      });
      output += `${prefix}}`;
      return output;
    }

    return `${prefix}${String(result)}`;
  }

  /**
   * Format as image
   */
  private static formatImage(result: any): string {
    if (typeof result === 'string') {
      // Assume it's a base64 or URL
      if (result.startsWith('data:') || result.startsWith('http')) {
        return result;
      }
      // Try to parse as base64
      return `data:image/png;base64,${result}`;
    }
    return String(result);
  }

  /**
   * Format as binary
   */
  private static formatBinary(result: any): string {
    if (typeof result === 'string') {
      return result;
    }
    if (result instanceof ArrayBuffer) {
      return `[Binary Data: ${result.byteLength} bytes]`;
    }
    return `[Binary Data]`;
  }

  /**
   * Format as stream (partial results)
   */
  private static formatStream(result: any): string {
    if (Array.isArray(result)) {
      return result.join('\n');
    }
    return String(result);
  }

  /**
   * Format as mixed content
   */
  private static formatMixed(result: any): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Detect programming language from code content
   */
  private static detectLanguage(code: string): string {
    const trimmed = code.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json';
    }
    if (trimmed.startsWith('<?php')) {
      return 'php';
    }
    if (trimmed.startsWith('#!/') || trimmed.includes('#!/bin/bash')) {
      return 'bash';
    }
    if (
      trimmed.startsWith('import {') ||
      trimmed.startsWith("import '") ||
      trimmed.startsWith('import "') ||
      trimmed.includes(" from '") ||
      trimmed.includes(' from "')
    ) {
      return 'javascript';
    }
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      return 'python';
    }
    if (trimmed.startsWith('function ') || trimmed.startsWith('const ')) {
      return 'javascript';
    }
    if (trimmed.startsWith('class ') || trimmed.startsWith('public ')) {
      return 'java';
    }
    if (trimmed.startsWith('def ')) {
      return 'python';
    }
    if (trimmed.startsWith('<')) {
      return 'html';
    }

    return '';
  }

  /**
   * Escape special characters in table cells
   */
  private static escapeTableCell(value: any): string {
    let str = String(value);
    // Escape pipe characters
    str = str.replace(/\|/g, '\\|');
    // Escape newlines
    str = str.replace(/\n/g, '\\n');
    // Truncate if too long
    if (str.length > 50) {
      str = str.substring(0, 47) + '...';
    }
    return str;
  }

  /**
   * Convert result to downloadable format
   */
  static toDownloadable(
    result: any,
    resultType: ResultType,
    filename: string
  ): { uri: string; filename: string; mimeType: string } {
    let content = '';
    let mimeType = 'text/plain';

    switch (resultType) {
      case ResultType.JSON:
        content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        mimeType = 'application/json';
        break;

      case ResultType.HTML:
        content = typeof result === 'string' ? result : String(result);
        mimeType = 'text/html';
        break;

      case ResultType.MARKDOWN:
        content = typeof result === 'string' ? result : String(result);
        mimeType = 'text/markdown';
        break;

      case ResultType.CODE_BLOCK:
        content = typeof result === 'string' ? result : String(result);
        mimeType = 'text/plain';
        break;

      case ResultType.IMAGE:
        mimeType = 'image/png';
        break;

      case ResultType.BINARY:
        mimeType = 'application/octet-stream';
        break;

      default:
        content = typeof result === 'string' ? result : String(result);
        mimeType = 'text/plain';
    }

    // Create data URI
    const uri = `data:${mimeType};base64,${Buffer.from(content).toString('base64')}`;

    return {
      uri,
      filename,
      mimeType,
    };
  }

  /**
   * Get available display formats for a result type
   */
  static getAvailableFormats(resultType: ResultType): ResultType[] {
    const formats: ResultType[] = [resultType];

    // Add alternative formats based on result type
    if (resultType === ResultType.JSON) {
      formats.push(ResultType.TEXT, ResultType.CODE_BLOCK, ResultType.TREE);
    } else if (resultType === ResultType.TABLE) {
      formats.push(ResultType.JSON, ResultType.TEXT);
    } else if (resultType === ResultType.MARKDOWN) {
      formats.push(ResultType.HTML, ResultType.TEXT);
    } else if (resultType === ResultType.CODE_BLOCK) {
      formats.push(ResultType.TEXT);
    }

    return formats;
  }
}
