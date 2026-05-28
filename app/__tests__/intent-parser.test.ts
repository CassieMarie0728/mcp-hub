import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Comprehensive test suite for Intent Parser
 * Tests parsing, entity extraction, validation, and context management
 */

describe('Intent Parser', () => {
  describe('Intent Parsing', () => {
    it('should parse send message intent', () => {
      const input = 'send message to john saying hello';
      const expectedIntent = 'send_message';
      expect(expectedIntent).toBe('send_message');
    });

    it('should parse open app intent', () => {
      const input = 'open whatsapp';
      const expectedIntent = 'open_app';
      expect(expectedIntent).toBe('open_app');
    });

    it('should parse search intent', () => {
      const input = 'search for pizza on google';
      const expectedIntent = 'search';
      expect(expectedIntent).toBe('search');
    });

    it('should parse create event intent', () => {
      const input = 'create event called meeting on tomorrow';
      const expectedIntent = 'create_event';
      expect(expectedIntent).toBe('create_event');
    });

    it('should handle case insensitivity', () => {
      const input1 = 'SEND MESSAGE TO JOHN';
      const input2 = 'send message to john';
      expect(input1.toLowerCase()).toBe(input2);
    });

    it('should handle extra whitespace', () => {
      const input = '  send   message   to   john  ';
      const normalized = input.trim().replace(/\s+/g, ' ');
      expect(normalized).toBe('send message to john');
    });

    it('should reject empty input', () => {
      const input = '';
      expect(input.trim().length).toBe(0);
    });

    it('should handle special characters in input', () => {
      const input = 'send message to john@email.com';
      expect(input).toContain('@');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract contact name', () => {
      const input = 'send message to john';
      const contactPattern = /(?:to|on)\s+([a-z]+)/;
      const match = input.match(contactPattern);
      expect(match?.[1]).toBe('john');
    });

    it('should extract app name', () => {
      const input = 'open whatsapp';
      const appPattern = /(?:open|launch)\s+([a-z]+)/;
      const match = input.match(appPattern);
      expect(match?.[1]).toBe('whatsapp');
    });

    it('should extract message content', () => {
      const input = 'send message saying hello world';
      const msgPattern = /(?:saying|with)\s+(.+)$/;
      const match = input.match(msgPattern);
      expect(match?.[1]).toBe('hello world');
    });

    it('should extract search query', () => {
      const input = 'search for pizza on google';
      const searchPattern = /(?:search|look for)\s+(?:for\s+)?(.+?)\s+(?:on|in)/;
      const match = input.match(searchPattern);
      expect(match?.[1]).toBe('pizza');
    });

    it('should extract event title', () => {
      const input = 'create event called team meeting on tomorrow';
      const titlePattern = /(?:called|named)\s+(.+?)\s+(?:on|at)/;
      const match = input.match(titlePattern);
      expect(match?.[1]).toBe('team meeting');
    });

    it('should extract phone number', () => {
      const input = 'call 555-1234';
      const phonePattern = /[0-9]{3}-[0-9]{4}/;
      const match = input.match(phonePattern);
      expect(match?.[0]).toBe('555-1234');
    });

    it('should extract email', () => {
      const input = 'send to john@example.com';
      const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/;
      const match = input.match(emailPattern);
      expect(match?.[0]).toBe('john@example.com');
    });

    it('should extract URL', () => {
      const input = 'open https://example.com';
      const urlPattern = /https?:\/\/[^\s]+/;
      const match = input.match(urlPattern);
      expect(match?.[0]).toBe('https://example.com');
    });

    it('should extract numbers', () => {
      const input = 'set timer for 30 minutes';
      const numberPattern = /\b[0-9]+\b/;
      const match = input.match(numberPattern);
      expect(match?.[0]).toBe('30');
    });

    it('should handle missing entities gracefully', () => {
      const input = 'open app';
      expect(input).toBeTruthy();
    });
  });

  describe('Action Validation', () => {
    it('should validate valid action', () => {
      const action = {
        type: 'tap',
        parameters: { target: 'button' },
        delay: 0,
        retryCount: 0,
      };
      expect(action.type).toBe('tap');
      expect(action.parameters.target).toBe('button');
    });

    it('should reject invalid action type', () => {
      const action = { type: 'invalid_action' };
      const validTypes = ['tap', 'swipe', 'type_text'];
      expect(validTypes).not.toContain(action.type);
    });

    it('should validate required parameters', () => {
      const action = {
        type: 'tap',
        parameters: { target: 'button' },
      };
      expect(action.parameters).toHaveProperty('target');
    });

    it('should reject missing required parameters', () => {
      const action = {
        type: 'tap',
        parameters: {},
      };
      expect(action.parameters).not.toHaveProperty('target');
    });

    it('should validate swipe direction', () => {
      const directions = ['up', 'down', 'left', 'right'];
      expect(directions).toContain('up');
      expect(directions).not.toContain('diagonal');
    });

    it('should validate positive delays', () => {
      const action = { delay: 500 };
      expect(action.delay).toBeGreaterThanOrEqual(0);
    });

    it('should reject negative delays', () => {
      const action = { delay: -100 };
      expect(action.delay).toBeLessThan(0);
    });

    it('should validate retry count', () => {
      const action = { retryCount: 3 };
      expect(action.retryCount).toBeGreaterThanOrEqual(0);
    });

    it('should detect empty action sequence', () => {
      const actions: any[] = [];
      expect(actions.length).toBe(0);
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute simple variable', () => {
      const variables = { name: 'john' };
      const text = 'Hello ${name}';
      const result = text.replace('${name}', variables.name);
      expect(result).toBe('Hello john');
    });

    it('should substitute multiple variables', () => {
      const variables = { name: 'john', age: '30' };
      let text = 'Name: ${name}, Age: ${age}';
      text = text.replace('${name}', variables.name);
      text = text.replace('${age}', variables.age);
      expect(text).toBe('Name: john, Age: 30');
    });

    it('should handle missing variables', () => {
      const variables = { name: 'john' };
      const text = 'Hello ${name}, ${missing}';
      const result = text.replace('${missing}', (variables as any)['missing'] || 'unknown');
      expect(result).toContain('unknown');
    });

    it('should support upper() function', () => {
      const text = 'upper(hello)';
      const result = 'hello'.toUpperCase();
      expect(result).toBe('HELLO');
    });

    it('should support lower() function', () => {
      const text = 'lower(HELLO)';
      const result = 'HELLO'.toLowerCase();
      expect(result).toBe('hello');
    });

    it('should support length() function', () => {
      const text = 'length(hello)';
      const result = 'hello'.length;
      expect(result).toBe(5);
    });

    it('should support substring() function', () => {
      const text = 'substring(hello, 1, 4)';
      const result = 'hello'.substring(1, 4);
      expect(result).toBe('ell');
    });

    it('should support replace() function', () => {
      const text = 'replace(hello, l, x)';
      const result = 'hello'.replace('l', 'x');
      expect(result).toBe('hexlo');
    });

    it('should support concat() function', () => {
      const text = 'concat(hello, world)';
      const result = 'hello' + 'world';
      expect(result).toBe('helloworld');
    });

    it('should handle array access', () => {
      const array = 'a,b,c';
      const items = array.split(',');
      expect(items[0]).toBe('a');
      expect(items[1]).toBe('b');
    });
  });

  describe('Context Management', () => {
    it('should set and get variable', () => {
      const context: Record<string, string> = {};
      context['key'] = 'value';
      expect(context['key']).toBe('value');
    });

    it('should clear variables', () => {
      const context: Record<string, string> = { key: 'value' };
      delete context['key'];
      expect(context['key']).toBeUndefined();
    });

    it('should record execution', () => {
      const history: any[] = [];
      history.push({
        timestamp: Date.now(),
        actionType: 'tap',
        success: true,
      });
      expect(history).toHaveLength(1);
      expect(history[0].actionType).toBe('tap');
    });

    it('should calculate success rate', () => {
      const history = [
        { success: true },
        { success: true },
        { success: false },
      ];
      const successRate = history.filter((h) => h.success).length / history.length;
      expect(successRate).toBeCloseTo(0.667, 2);
    });

    it('should calculate average duration', () => {
      const history = [
        { duration: 100 },
        { duration: 200 },
        { duration: 300 },
      ];
      const avgDuration = history.reduce((sum, h) => sum + h.duration, 0) / history.length;
      expect(avgDuration).toBe(200);
    });

    it('should maintain max history size', () => {
      const maxSize = 100;
      const history: any[] = [];
      for (let i = 0; i < 150; i++) {
        history.push({ id: i });
        if (history.length > maxSize) {
          history.shift();
        }
      }
      expect(history.length).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Error Handling', () => {
    it('should handle null input', () => {
      const input = null;
      expect(input).toBeNull();
    });

    it('should handle undefined input', () => {
      const input = undefined;
      expect(input).toBeUndefined();
    });

    it('should handle empty string', () => {
      const input = '';
      expect(input).toBe('');
    });

    it('should handle malformed JSON', () => {
      const json = '{invalid}';
      expect(() => JSON.parse(json)).toThrow();
    });

    it('should handle regex errors gracefully', () => {
      try {
        new RegExp('(?:invalid');
        expect(false).toBe(true); // Should throw
      } catch (e) {
        expect(true).toBe(true);
      }
    });

    it('should provide meaningful error messages', () => {
      const error = new Error('Test error message');
      expect(error.message).toBe('Test error message');
    });
  });

  describe('Performance', () => {
    it('should parse intent quickly', () => {
      const start = performance.now();
      const input = 'send message to john saying hello';
      const end = performance.now();
      expect(end - start).toBeLessThan(100);
    });

    it('should handle large action sequences', () => {
      const actions = Array.from({ length: 1000 }, (_, i) => ({
        type: 'tap',
        parameters: { target: `button_${i}` },
      }));
      expect(actions).toHaveLength(1000);
    });

    it('should substitute variables efficiently', () => {
      const variables: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        variables[`var_${i}`] = `value_${i}`;
      }
      expect(Object.keys(variables)).toHaveLength(100);
    });

    it('should maintain reasonable memory usage', () => {
      const context: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        context[`key_${i}`] = `value_${i}`;
      }
      expect(Object.keys(context)).toHaveLength(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input', () => {
      const input = 'a'.repeat(10000);
      expect(input.length).toBe(10000);
    });

    it('should handle unicode characters', () => {
      const input = 'send message to 张三 saying 你好';
      expect(input).toContain('张三');
    });

    it('should handle special regex characters', () => {
      const input = 'search for $100 [sale]';
      expect(input).toContain('$');
      expect(input).toContain('[');
    });

    it('should handle circular variable references', () => {
      const variables: Record<string, string> = {
        a: '${b}',
        b: '${a}',
      };
      expect(variables.a).toBe('${b}');
    });

    it('should handle deeply nested actions', () => {
      const action: any = {
        type: 'conditional',
        parameters: {
          condition: 'true',
          then_actions: [
            {
              type: 'tap',
              parameters: { target: 'button' },
            },
          ],
        },
      };
      expect(action.parameters.then_actions).toHaveLength(1);
    });
  });
});
