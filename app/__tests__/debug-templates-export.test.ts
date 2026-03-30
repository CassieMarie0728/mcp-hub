import { describe, it, expect, beforeEach } from 'vitest';
import { MacroDebugger } from '@/server/debugging/macro-debugger';
import { MacroTemplatesSystem } from '@/server/templates/macro-templates';
import { MacroExportImportEngine } from '@/server/export-import/macro-export-import';

describe('Macro Debugging, Templates, and Export/Import', () => {
  let debugger: MacroDebugger;
  let templates: MacroTemplatesSystem;
  let exportImport: MacroExportImportEngine;

  beforeEach(() => {
    debugger = new MacroDebugger();
    templates = new MacroTemplatesSystem();
    exportImport = new MacroExportImportEngine();
  });

  // ============ DEBUGGER TESTS ============

  describe('MacroDebugger', () => {
    it('should start debug session', () => {
      const session = debugger.startDebugSession('session1', 'macro1', [
        { type: 'tap', target: 'Button' },
        { type: 'type', text: 'Hello' },
      ]);

      expect(session.sessionId).toBe('session1');
      expect(session.status).toBe('paused');
      expect(session.currentActionIndex).toBe(0);
      expect(session.totalActions).toBe(2);
    });

    it('should set and get breakpoints', () => {
      debugger.setBreakpoint('macro1', 5);
      debugger.setBreakpoint('macro1', 10);

      const breakpoints = debugger.getBreakpoints('macro1');
      expect(breakpoints).toContain(5);
      expect(breakpoints).toContain(10);
    });

    it('should remove breakpoint', () => {
      debugger.setBreakpoint('macro1', 5);
      debugger.removeBreakpoint('macro1', 5);

      const breakpoints = debugger.getBreakpoints('macro1');
      expect(breakpoints).not.toContain(5);
    });

    it('should add watch expression', () => {
      const watch = debugger.addWatchExpression('macro1', '$message.length');
      expect(watch.expression).toBe('$message.length');
      expect(watch.id).toBeDefined();
    });

    it('should step over action', () => {
      const session = debugger.startDebugSession('session1', 'macro1', [
        { type: 'tap' },
        { type: 'type' },
      ]);

      const stepped = debugger.stepOver('session1');
      expect(stepped?.currentActionIndex).toBe(1);
      expect(stepped?.status).toBe('running');
    });

    it('should set variable', () => {
      debugger.startDebugSession('session1', 'macro1', []);
      const result = debugger.setVariable('session1', 'count', 42);

      expect(result).toBe(true);
      const variable = debugger.getVariable('session1', 'count');
      expect(variable?.value).toBe(42);
    });

    it('should evaluate expression', () => {
      debugger.startDebugSession('session1', 'macro1', []);
      debugger.setVariable('session1', 'x', 10);
      debugger.setVariable('session1', 'y', 5);

      const result = debugger.evaluateExpression('session1', '$x + $y');
      expect(result.value).toBe(15);
      expect(result.error).toBeNull();
    });

    it('should record action execution', () => {
      debugger.startDebugSession('session1', 'macro1', []);
      debugger.recordActionExecution('session1', 0, { type: 'tap' }, { success: true });

      const history = debugger.getExecutionHistory('session1');
      expect(history.length).toBe(1);
      expect(history[0].result.success).toBe(true);
    });

    it('should export debug session', () => {
      debugger.startDebugSession('session1', 'macro1', [{ type: 'tap' }]);
      debugger.setVariable('session1', 'x', 10);

      const exported = debugger.exportDebugSession('session1');
      expect(exported).toBeDefined();

      const parsed = JSON.parse(exported);
      expect(parsed.sessionId).toBe('session1');
      expect(parsed.macroId).toBe('macro1');
    });
  });

  // ============ TEMPLATES TESTS ============

  describe('MacroTemplatesSystem', () => {
    it('should get all templates', () => {
      const allTemplates = templates.getAllTemplates();
      expect(allTemplates.length).toBeGreaterThan(0);
    });

    it('should get template by ID', () => {
      const template = templates.getTemplate('email_automation');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Email Automation');
    });

    it('should get templates by category', () => {
      const productivityTemplates = templates.getTemplatesByCategory('productivity');
      expect(productivityTemplates.length).toBeGreaterThan(0);
      expect(productivityTemplates.every((t) => t.category === 'productivity')).toBe(true);
    });

    it('should get templates by difficulty', () => {
      const beginnerTemplates = templates.getTemplatesByDifficulty('beginner');
      expect(beginnerTemplates.length).toBeGreaterThan(0);
      expect(beginnerTemplates.every((t) => t.difficulty === 'beginner')).toBe(true);
    });

    it('should search templates', () => {
      const results = templates.searchTemplates('email');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((t) => t.name.toLowerCase().includes('email'))).toBe(true);
    });

    it('should get trending templates', () => {
      const trending = templates.getTrendingTemplates(5);
      expect(trending.length).toBeGreaterThanOrEqual(0);
      expect(trending.length).toBeLessThanOrEqual(5);
    });

    it('should get top-rated templates', () => {
      const topRated = templates.getTopRatedTemplates(5);
      expect(topRated.length).toBeGreaterThanOrEqual(0);
      expect(topRated[0]?.rating).toBeGreaterThanOrEqual(topRated[1]?.rating || 0);
    });

    it('should create macro from template', () => {
      const macro = templates.createMacroFromTemplate('user1', 'email_automation', 'My Email', {
        recipient_email: 'test@example.com',
        email_subject: 'Test',
        email_body: 'Hello',
      });

      expect(macro.id).toBeDefined();
      expect(macro.name).toBe('My Email');
      expect(macro.templateId).toBe('email_automation');
    });

    it('should validate required variables', () => {
      expect(() => {
        templates.createMacroFromTemplate('user1', 'email_automation', 'My Email', {});
      }).toThrow();
    });

    it('should get user macros', () => {
      templates.createMacroFromTemplate('user1', 'email_automation', 'Macro 1', {
        recipient_email: 'test@example.com',
        email_subject: 'Test',
        email_body: 'Hello',
      });

      const userMacros = templates.getUserMacros('user1');
      expect(userMacros.length).toBe(1);
    });

    it('should get categories', () => {
      const categories = templates.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('productivity');
    });

    it('should get template statistics', () => {
      const stats = templates.getTemplateStatistics();
      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(stats.totalDownloads).toBeGreaterThan(0);
      expect(stats.avgRating).toBeGreaterThan(0);
    });
  });

  // ============ EXPORT/IMPORT TESTS ============

  describe('MacroExportImportEngine', () => {
    it('should export macro', () => {
      const macro = {
        id: 'macro1',
        name: 'Test Macro',
        description: 'Test',
        actions: [{ type: 'tap', target: 'Button' }],
        variables: [{ name: 'x', type: 'string' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const exported = exportImport.exportMacro(macro);
      expect(exported.version).toBe('1.0');
      expect(exported.macro.name).toBe('Test Macro');
      expect(exported.checksums.macro).toBeDefined();
    });

    it('should import macro', () => {
      const macro = {
        id: 'macro1',
        name: 'Test Macro',
        description: 'Test',
        actions: [{ type: 'tap', target: 'Button' }],
        variables: [{ name: 'x', type: 'string' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const exported = exportImport.exportMacro(macro);
      const result = exportImport.importMacro(JSON.stringify(exported));

      expect(result.success).toBe(true);
      expect(result.macro?.name).toBe('Test Macro');
    });

    it('should detect corrupted macro', () => {
      const macro = {
        id: 'macro1',
        name: 'Test Macro',
        description: 'Test',
        actions: [],
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const exported = exportImport.exportMacro(macro);
      exported.macro.name = 'Modified'; // Corrupt the data

      const result = exportImport.importMacro(JSON.stringify(exported));
      expect(result.success).toBe(false);
    });

    it('should resolve dependencies', () => {
      const macro = {
        id: 'macro1',
        name: 'Test',
        description: 'Test',
        actions: [
          { type: 'tap', target: 'Gmail App' },
          { type: 'type', text: '${email}' },
        ],
        variables: [{ name: 'email', type: 'string' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const exported = exportImport.exportMacro(macro);
      expect(exported.dependencies.length).toBeGreaterThan(0);
    });

    it('should export macro bundle', () => {
      const macros = [
        {
          id: 'macro1',
          name: 'Macro 1',
          description: 'Test',
          actions: [],
          variables: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'macro2',
          name: 'Macro 2',
          description: 'Test',
          actions: [],
          variables: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const bundle = exportImport.exportMacroBundle(macros);
      const parsed = JSON.parse(bundle);

      expect(parsed.macros.length).toBe(2);
      expect(parsed.metadata.count).toBe(2);
    });

    it('should import macro bundle', () => {
      const macros = [
        {
          id: 'macro1',
          name: 'Macro 1',
          description: 'Test',
          actions: [],
          variables: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const bundle = exportImport.exportMacroBundle(macros);
      const result = exportImport.importMacroBundle(bundle);

      expect(result.success).toBe(true);
      expect(result.macros.length).toBe(1);
    });

    it('should validate macro compatibility', () => {
      const macro = {
        id: 'macro1',
        name: 'Test',
        description: 'Test',
        actions: [{ type: 'tap', target: 'Button' }],
        variables: [{ name: 'x', type: 'string' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = exportImport.validateCompatibility(macro, '1.0');
      expect(result.compatible).toBe(true);
    });

    it('should detect missing variables', () => {
      const macro = {
        id: 'macro1',
        name: 'Test',
        description: 'Test',
        actions: [{ type: 'type', text: '${undefined_var}' }],
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = exportImport.validateCompatibility(macro, '1.0');
      expect(result.compatible).toBe(false);
      expect(result.issues.some((i: any) => i.severity === 'error')).toBe(true);
    });

    it('should merge macros', () => {
      const macro1 = {
        id: 'macro1',
        name: 'Macro 1',
        description: 'Test',
        actions: [{ type: 'tap', target: 'Button' }],
        variables: [{ name: 'x', type: 'string' }],
        tags: ['tag1'],
      };

      const macro2 = {
        id: 'macro2',
        name: 'Macro 2',
        description: 'Test',
        actions: [{ type: 'type', text: 'Hello' }],
        variables: [{ name: 'y', type: 'string' }],
        tags: ['tag2'],
      };

      const merged = exportImport.mergeMacros(macro1, macro2, 'concat');
      expect(merged.actions.length).toBe(2);
      expect(merged.variables.length).toBe(2);
      expect(merged.tags.length).toBe(2);
    });

    it('should estimate macro size', () => {
      const macro = {
        id: 'macro1',
        name: 'Test',
        description: 'Test',
        actions: [{ type: 'tap' }, { type: 'type' }],
        variables: [{ name: 'x' }],
      };

      const size = exportImport.estimateMacroSize(macro);
      expect(size.uncompressed).toBeGreaterThan(0);
      expect(size.estimated_compressed).toBeGreaterThan(0);
      expect(size.estimated_compressed).toBeLessThan(size.uncompressed);
    });
  });
});
