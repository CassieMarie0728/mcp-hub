import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResultDisplayFormatter } from '../../lib/utils/ResultDisplayFormatter';
import { ResultType } from '../../lib/types/result-type';

describe('ResultDisplayFormatter', () => {
  describe('formatResult', () => {
    it('should format plain text results', () => {
      const result = ResultDisplayFormatter.formatResult('Hello World', ResultType.TEXT);
      expect(result.format).toBe(ResultType.TEXT);
      expect(result.content).toBe('Hello World');
      expect(result.metadata.canCopy).toBe(true);
    });

    it('should format JSON results with pretty printing', () => {
      const jsonData = { name: 'test', value: 123 };
      const result = ResultDisplayFormatter.formatResult(jsonData, ResultType.JSON);
      expect(result.format).toBe(ResultType.JSON);
      expect(result.content).toContain('"name"');
      expect(result.content).toContain('"test"');
    });

    it('should format table results from array of objects', () => {
      const tableData = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      const result = ResultDisplayFormatter.formatResult(tableData, ResultType.TABLE);
      expect(result.format).toBe(ResultType.TABLE);
      expect(result.content).toContain('|');
      expect(result.content).toContain('Alice');
      expect(result.content).toContain('Bob');
    });

    it('should format tree results for nested objects', () => {
      const treeData = {
        root: {
          child1: 'value1',
          child2: {
            nested: 'value2',
          },
        },
      };
      const result = ResultDisplayFormatter.formatResult(treeData, ResultType.TREE);
      expect(result.format).toBe(ResultType.TREE);
      expect(result.content).toContain('root');
      expect(result.content).toContain('child1');
      expect(result.content).toContain('nested');
    });

    it('should format code blocks with language detection', () => {
      const code = 'import { useState } from "react";';
      const result = ResultDisplayFormatter.formatResult(code, ResultType.CODE_BLOCK);
      expect(result.format).toBe(ResultType.CODE_BLOCK);
      expect(result.content).toContain('```');
      expect(result.content).toContain('javascript');
    });

    it('should handle image format', () => {
      const imageUri = 'data:image/png;base64,iVBORw0KGgo=';
      const result = ResultDisplayFormatter.formatResult(imageUri, ResultType.IMAGE);
      expect(result.format).toBe(ResultType.IMAGE);
      expect(result.metadata.canDownload).toBe(true);
      expect(result.metadata.canCopy).toBe(false);
    });

    it('should handle binary format', () => {
      const buffer = new ArrayBuffer(1024);
      const result = ResultDisplayFormatter.formatResult(buffer, ResultType.BINARY);
      expect(result.format).toBe(ResultType.BINARY);
      expect(result.metadata.canDownload).toBe(true);
      expect(result.content).toContain('Binary Data');
    });

    it('should track result size metadata', () => {
      const largeText = 'x'.repeat(1024 * 1024); // 1MB
      const result = ResultDisplayFormatter.formatResult(largeText, ResultType.TEXT);
      expect(result.metadata.size).toBeGreaterThan(0);
      expect(result.metadata.isLarge).toBe(true);
    });
  });

  describe('toDownloadable', () => {
    it('should create downloadable JSON format', () => {
      const data = { test: 'data' };
      const downloadable = ResultDisplayFormatter.toDownloadable(data, ResultType.JSON, 'test.json');
      expect(downloadable.filename).toBe('test.json');
      expect(downloadable.mimeType).toBe('application/json');
      expect(downloadable.uri).toContain('data:application/json');
    });

    it('should create downloadable HTML format', () => {
      const html = '<html><body>Test</body></html>';
      const downloadable = ResultDisplayFormatter.toDownloadable(html, ResultType.HTML, 'test.html');
      expect(downloadable.filename).toBe('test.html');
      expect(downloadable.mimeType).toBe('text/html');
    });

    it('should create downloadable Markdown format', () => {
      const markdown = '# Test\n\nThis is a test';
      const downloadable = ResultDisplayFormatter.toDownloadable(
        markdown,
        ResultType.MARKDOWN,
        'test.md'
      );
      expect(downloadable.filename).toBe('test.md');
      expect(downloadable.mimeType).toBe('text/markdown');
    });
  });

  describe('getAvailableFormats', () => {
    it('should return JSON format options for JSON results', () => {
      const formats = ResultDisplayFormatter.getAvailableFormats(ResultType.JSON);
      expect(formats).toContain(ResultType.JSON);
      expect(formats).toContain(ResultType.TEXT);
      expect(formats).toContain(ResultType.CODE_BLOCK);
      expect(formats).toContain(ResultType.TREE);
    });

    it('should return table format options for TABLE results', () => {
      const formats = ResultDisplayFormatter.getAvailableFormats(ResultType.TABLE);
      expect(formats).toContain(ResultType.TABLE);
      expect(formats).toContain(ResultType.JSON);
      expect(formats).toContain(ResultType.TEXT);
    });

    it('should return markdown format options for MARKDOWN results', () => {
      const formats = ResultDisplayFormatter.getAvailableFormats(ResultType.MARKDOWN);
      expect(formats).toContain(ResultType.MARKDOWN);
      expect(formats).toContain(ResultType.HTML);
      expect(formats).toContain(ResultType.TEXT);
    });
  });

  describe('Edge cases', () => {
    it('should handle null values gracefully', () => {
      const result = ResultDisplayFormatter.formatResult(null, ResultType.TEXT);
      expect(result.content).toBe('null');
    });

    it('should handle undefined values gracefully', () => {
      const result = ResultDisplayFormatter.formatResult(undefined, ResultType.TEXT);
      expect(result.content).toBe('undefined');
    });

    it('should handle empty arrays', () => {
      const result = ResultDisplayFormatter.formatResult([], ResultType.TABLE);
      expect(result.content).toBe('[]');
    });

    it('should handle empty objects', () => {
      const result = ResultDisplayFormatter.formatResult({}, ResultType.TREE);
      expect(result.content).toContain('{}');
    });

    it('should truncate very large results', () => {
      const hugeText = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const result = ResultDisplayFormatter.formatResult(hugeText, ResultType.TEXT);
      expect(result.content.length).toBeLessThan(hugeText.length);
      expect(result.metadata.isLarge).toBe(true);
    });

    it('should escape special characters in table cells', () => {
      const tableData = [
        { id: 1, description: 'Test | with | pipes' },
        { id: 2, description: 'Test\nwith\nnewlines' },
      ];
      const result = ResultDisplayFormatter.formatResult(tableData, ResultType.TABLE);
      expect(result.content).toContain('\\|');
      expect(result.content).toContain('\\n');
    });
  });

  describe('Language detection', () => {
    it('should detect JSON code blocks', () => {
      const json = '{"key": "value"}';
      const result = ResultDisplayFormatter.formatResult(json, ResultType.CODE_BLOCK);
      expect(result.content).toContain('```json');
    });

    it('should detect Python code blocks', () => {
      const python = 'def hello():\n  print("world")';
      const result = ResultDisplayFormatter.formatResult(python, ResultType.CODE_BLOCK);
      expect(result.content).toContain('```python');
    });

    it('should detect JavaScript code blocks', () => {
      const js = 'const x = 42;';
      const result = ResultDisplayFormatter.formatResult(js, ResultType.CODE_BLOCK);
      expect(result.content).toContain('```javascript');
    });

    it('should detect HTML code blocks', () => {
      const html = '<div>Test</div>';
      const result = ResultDisplayFormatter.formatResult(html, ResultType.CODE_BLOCK);
      expect(result.content).toContain('```html');
    });

    it('should default to no language for unknown code', () => {
      const unknown = 'some random text';
      const result = ResultDisplayFormatter.formatResult(unknown, ResultType.CODE_BLOCK);
      expect(result.content).toContain('```\n');
    });
  });
});

describe('Tool Execution Integration', () => {
  it('should handle successful tool execution result', () => {
    const executionResult = {
      success: true,
      result: { message: 'Tool executed successfully' },
      resultType: ResultType.JSON,
      executionTimeMs: 250,
      timestamp: Date.now(),
    };

    const formatted = ResultDisplayFormatter.formatResult(
      executionResult.result,
      executionResult.resultType
    );
    expect(formatted.format).toBe(ResultType.JSON);
    expect(formatted.content).toContain('message');
  });

  it('should handle failed tool execution result', () => {
    const executionResult = {
      success: false,
      resultType: ResultType.TEXT,
      error: {
        code: 'EXECUTION_TIMEOUT',
        message: 'Tool execution timed out after 30s',
      },
      executionTimeMs: 30000,
      timestamp: Date.now(),
    };

    expect(executionResult.success).toBe(false);
    expect(executionResult.error?.code).toBe('EXECUTION_TIMEOUT');
  });

  it('should handle streaming results', () => {
    const streamingResult = ['Line 1', 'Line 2', 'Line 3'];
    const result = ResultDisplayFormatter.formatResult(streamingResult, ResultType.STREAM);
    expect(result.content).toContain('Line 1');
    expect(result.content).toContain('Line 2');
    expect(result.content).toContain('Line 3');
  });
});
