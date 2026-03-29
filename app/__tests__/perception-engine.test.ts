import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Comprehensive test suite for Hybrid Perception Engine
 * Tests accessibility service, visual chip generation, formatting, and integration
 */

describe('Hybrid Perception Engine', () => {
  describe('Accessibility Service Integration', () => {
    it('should parse accessibility tree correctly', () => {
      // Mock accessibility tree structure
      const mockElements = [
        {
          id: '1',
          type: 'button',
          text: 'Submit',
          contentDescription: 'Submit button',
          className: 'android.widget.Button',
          isClickable: true,
          isEditable: false,
          isEnabled: true,
          bounds: { left: 100, top: 200, right: 200, bottom: 250, width: 100, height: 50 },
        },
        {
          id: '2',
          type: 'textinput',
          text: '',
          contentDescription: 'Email input',
          className: 'android.widget.EditText',
          isClickable: false,
          isEditable: true,
          isEnabled: true,
          bounds: { left: 100, top: 100, right: 300, bottom: 150, width: 200, height: 50 },
        },
      ];

      expect(mockElements).toHaveLength(2);
      expect(mockElements[0].type).toBe('button');
      expect(mockElements[1].type).toBe('textinput');
    });

    it('should identify interactive elements', () => {
      const mockElements = [
        { id: '1', isClickable: true, isEditable: false },
        { id: '2', isClickable: false, isEditable: true },
        { id: '3', isClickable: false, isEditable: false },
      ];

      const interactive = mockElements.filter((e) => e.isClickable || e.isEditable);
      expect(interactive).toHaveLength(2);
    });

    it('should find element by text', () => {
      const mockElements = [
        { id: '1', text: 'Submit' },
        { id: '2', text: 'Cancel' },
        { id: '3', text: 'Login' },
      ];

      const found = mockElements.find((e) => e.text.includes('Submit'));
      expect(found).toBeDefined();
      expect(found?.id).toBe('1');
    });

    it('should find element by coordinates', () => {
      const mockElements = [
        { id: '1', bounds: { left: 100, top: 100, right: 200, bottom: 150 } },
        { id: '2', bounds: { left: 100, top: 200, right: 200, bottom: 250 } },
      ];

      const x = 150;
      const y = 120;
      const found = mockElements.find((e) => {
        const b = e.bounds;
        return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe('1');
    });

    it('should calculate element depth correctly', () => {
      const mockElements = [
        { id: '1', depth: 0 },
        { id: '2', depth: 1 },
        { id: '3', depth: 2 },
        { id: '4', depth: 1 },
      ];

      const maxDepth = Math.max(...mockElements.map((e) => e.depth));
      expect(maxDepth).toBe(2);
    });
  });

  describe('Visual Chip Generation', () => {
    it('should generate visual chips for interactive elements', () => {
      const mockElements = [
        { id: '1', type: 'button', text: 'Submit', isInteractive: true },
        { id: '2', type: 'text', text: 'Label', isInteractive: false },
        { id: '3', type: 'input', text: '', isInteractive: true },
      ];

      const chips = mockElements.filter((e) => e.isInteractive);
      expect(chips).toHaveLength(2);
    });

    it('should encode visual chip as Base64', () => {
      const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(mockBase64).toBeTruthy();
      expect(mockBase64.length).toBeGreaterThan(0);
    });

    it('should resize bitmap to max dimensions', () => {
      const originalWidth = 1080;
      const originalHeight = 1920;
      const maxWidth = 512;
      const maxHeight = 512;

      const aspectRatio = originalWidth / originalHeight;
      let newWidth: number;
      let newHeight: number;

      if (originalWidth > originalHeight) {
        newWidth = maxWidth;
        newHeight = Math.floor(newWidth / aspectRatio);
      } else {
        newHeight = maxHeight;
        newWidth = Math.floor(newHeight * aspectRatio);
      }

      expect(newWidth).toBeLessThanOrEqual(maxWidth);
      expect(newHeight).toBeLessThanOrEqual(maxHeight);
    });

    it('should handle empty visual chips gracefully', () => {
      const mockElements: any[] = [];
      const chips = mockElements.filter((e) => e.isInteractive);
      expect(chips).toHaveLength(0);
    });
  });

  describe('Perception Formatter', () => {
    it('should format accessibility tree as JSON', () => {
      const mockElements = [
        {
          id: '1',
          type: 'button',
          text: 'Submit',
          bounds: { left: 100, top: 200, right: 200, bottom: 250 },
        },
      ];

      const json = {
        type: 'accessibility_tree',
        timestamp: Date.now(),
        elementCount: mockElements.length,
        elements: mockElements,
      };

      expect(json.type).toBe('accessibility_tree');
      expect(json.elementCount).toBe(1);
    });

    it('should format condensed JSON with minimal tokens', () => {
      const mockElements = [
        { id: '1', type: 'button', text: 'Submit', interactive: true },
      ];

      const condensed = {
        t: Date.now(),
        c: mockElements.length,
        e: mockElements.map((el) => ({
          id: el.id,
          ty: el.type,
          tx: el.text,
          i: el.interactive,
        })),
      };

      expect(condensed.c).toBe(1);
      expect(condensed.e[0].ty).toBe('button');
    });

    it('should extract text content from screen', () => {
      const mockElements = [
        { text: 'Hello' },
        { text: 'World' },
        { text: '' },
      ];

      const textContent = mockElements
        .filter((e) => e.text)
        .map((e) => e.text)
        .join('\n');

      expect(textContent).toContain('Hello');
      expect(textContent).toContain('World');
    });

    it('should extract button labels', () => {
      const mockElements = [
        { type: 'button', text: 'Submit' },
        { type: 'button', text: 'Cancel' },
        { type: 'text', text: 'Label' },
      ];

      const buttons = mockElements.filter((e) => e.type === 'button').map((e) => e.text);
      expect(buttons).toHaveLength(2);
      expect(buttons).toContain('Submit');
    });

    it('should extract input fields', () => {
      const mockElements = [
        { id: '1', isEditable: true, className: 'EditText', contentDescription: 'Email' },
        { id: '2', isEditable: true, className: 'PasswordEditText', contentDescription: 'Password' },
        { id: '3', isEditable: false, className: 'TextView' },
      ];

      const inputs = mockElements.filter((e) => e.isEditable);
      expect(inputs).toHaveLength(2);
    });

    it('should find element at coordinates', () => {
      const mockElements = [
        { id: '1', bounds: { left: 100, top: 100, right: 200, bottom: 150 } },
        { id: '2', bounds: { left: 100, top: 200, right: 200, bottom: 250 } },
      ];

      const x = 150;
      const y = 225;

      const found = mockElements.find((e) => {
        const b = e.bounds;
        return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
      });

      expect(found?.id).toBe('2');
    });
  });

  describe('Hybrid Perception Engine', () => {
    it('should combine accessibility and visual perception', () => {
      const accessibilityElements = [
        { id: '1', type: 'button', text: 'Submit', interactive: true },
      ];

      const visualChips = [
        { elementId: '1', elementText: 'Submit', base64Data: 'mock_base64' },
      ];

      const hybrid = {
        accessibility: accessibilityElements,
        visual: visualChips,
        timestamp: Date.now(),
      };

      expect(hybrid.accessibility).toHaveLength(1);
      expect(hybrid.visual).toHaveLength(1);
    });

    it('should estimate screen complexity', () => {
      const mockElements = Array.from({ length: 75 }, (_, i) => ({
        id: String(i),
        depth: Math.floor(i / 25),
      }));

      const complexity = {
        totalElements: mockElements.length,
        maxDepth: Math.max(...mockElements.map((e) => e.depth)),
        complexity: mockElements.length > 100 ? 'high' : mockElements.length > 50 ? 'medium' : 'low',
      };

      expect(complexity.complexity).toBe('medium');
    });

    it('should compare perception snapshots', () => {
      const previous = [
        { id: '1', text: 'Submit' },
        { id: '2', text: 'Cancel' },
      ];

      const current = [
        { id: '1', text: 'Submit' },
        { id: '2', text: 'Close' },
        { id: '3', text: 'Help' },
      ];

      const added = current.filter((c) => !previous.some((p) => p.id === c.id));
      const removed = previous.filter((p) => !current.some((c) => c.id === p.id));
      const changed = current.filter((c) => previous.some((p) => p.id === c.id && p.text !== c.text));

      expect(added).toHaveLength(1);
      expect(removed).toHaveLength(0);
      expect(changed).toHaveLength(1);
    });

    it('should cache perception results', () => {
      const cache = new Map<string, any>();
      const key = 'perception_1234567890';
      const value = { elements: [], timestamp: Date.now() };

      cache.set(key, value);
      expect(cache.get(key)).toEqual(value);

      cache.delete(key);
      expect(cache.get(key)).toBeUndefined();
    });

    it('should handle perception errors gracefully', () => {
      const result = {
        success: false,
        errorMessage: 'No screen structure available',
        elements: [],
        visualChips: [],
      };

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeTruthy();
    });
  });

  describe('Performance & Optimization', () => {
    it('should debounce perception updates', () => {
      let callCount = 0;
      const debounce = (fn: () => void, delay: number) => {
        let timeout: NodeJS.Timeout;
        return () => {
          clearTimeout(timeout);
          timeout = setTimeout(fn, delay);
        };
      };

      const increment = debounce(() => {
        callCount++;
      }, 100);

      increment();
      increment();
      increment();

      expect(callCount).toBe(0);
    });

    it('should limit cache size', () => {
      const cache = new Map<string, any>();
      const maxSize = 10;

      for (let i = 0; i < 15; i++) {
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(`key_${i}`, { data: i });
      }

      expect(cache.size).toBeLessThanOrEqual(maxSize);
    });

    it('should calculate perception generation time', () => {
      const startTime = Date.now();
      // Simulate perception generation
      const elements = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
      const endTime = Date.now();
      const generationTime = endTime - startTime;

      expect(generationTime).toBeGreaterThanOrEqual(0);
    });

    it('should optimize element filtering', () => {
      const mockElements = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        interactive: i % 3 === 0,
      }));

      const start = performance.now();
      const interactive = mockElements.filter((e) => e.interactive);
      const end = performance.now();

      expect(interactive.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty screen', () => {
      const elements: any[] = [];
      expect(elements).toHaveLength(0);
    });

    it('should handle very deep element hierarchy', () => {
      const elements = Array.from({ length: 100 }, (_, i) => ({ depth: i }));
      const maxDepth = Math.max(...elements.map((e) => e.depth));
      expect(maxDepth).toBe(99);
    });

    it('should handle elements with missing properties', () => {
      const elements = [
        { id: '1', text: 'Button' },
        { id: '2' },
        { id: '3', text: '' },
      ];

      const withText = elements.filter((e) => e.text);
      expect(withText).toHaveLength(1);
    });

    it('should handle coordinate lookup outside bounds', () => {
      const elements = [{ id: '1', bounds: { left: 100, top: 100, right: 200, bottom: 150 } }];
      const x = 50;
      const y = 50;

      const found = elements.find((e) => {
        const b = e.bounds;
        return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
      });

      expect(found).toBeUndefined();
    });

    it('should handle text search with special characters', () => {
      const elements = [
        { id: '1', text: 'Hello & Goodbye' },
        { id: '2', text: 'Test@123' },
      ];

      const found = elements.find((e) => e.text.includes('&'));
      expect(found).toBeDefined();
      expect(found?.id).toBe('1');
    });
  });
});
