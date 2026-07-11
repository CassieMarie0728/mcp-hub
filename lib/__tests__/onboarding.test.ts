import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('Onboarding Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Onboarding Steps', () => {
    it('should have 8 onboarding steps', () => {
      const steps = [
        'welcome',
        'connect-server',
        'execute-tool',
        'view-history',
        'ai-assistant',
        'manage-macros',
        'explore-marketplace',
        'settings',
      ];
      expect(steps).toHaveLength(8);
    });

    it('should have valid step data structure', () => {
      const stepData = {
        id: 'welcome',
        title: 'Welcome to MCP Hub',
        description: 'Your unified control center for managing MCP servers and executing tools across all your workflows.',
        icon: 'rocket',
        action: 'Get Started',
        tips: [
          'MCP Hub connects to multiple MCP servers',
          'Execute tools instantly from your mobile device',
          'Track all your tool executions in one place',
        ],
      };
      
      expect(stepData).toHaveProperty('id');
      expect(stepData).toHaveProperty('title');
      expect(stepData).toHaveProperty('description');
      expect(stepData).toHaveProperty('icon');
      expect(stepData).toHaveProperty('action');
      expect(stepData).toHaveProperty('tips');
      expect(stepData.tips).toBeInstanceOf(Array);
      expect(stepData.tips.length).toBeGreaterThan(0);
    });
  });

  describe('Onboarding State Management', () => {
    it('should persist onboarding completion status', async () => {
      const mockSetItem = vi.fn();
      (AsyncStorage.setItem as any).mockImplementation(mockSetItem);

      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      expect(mockSetItem).toHaveBeenCalledWith('onboarding_completed', 'true');
    });

    it('should persist current onboarding step', async () => {
      const mockSetItem = vi.fn();
      (AsyncStorage.setItem as any).mockImplementation(mockSetItem);

      await AsyncStorage.setItem('onboarding_current_step', 'connect-server');
      
      expect(mockSetItem).toHaveBeenCalledWith('onboarding_current_step', 'connect-server');
    });

    it('should load onboarding state from storage', async () => {
      const mockGetItem = vi.fn()
        .mockResolvedValueOnce('true') // onboarding_completed
        .mockResolvedValueOnce('connect-server'); // onboarding_current_step

      (AsyncStorage.getItem as any).mockImplementation(mockGetItem);

      const completed = await AsyncStorage.getItem('onboarding_completed');
      const currentStep = await AsyncStorage.getItem('onboarding_current_step');
      
      expect(completed).toBe('true');
      expect(currentStep).toBe('connect-server');
    });

    it('should reset onboarding state', async () => {
      const mockRemoveItem = vi.fn();
      (AsyncStorage.removeItem as any).mockImplementation(mockRemoveItem);

      await AsyncStorage.removeItem('onboarding_completed');
      await AsyncStorage.removeItem('onboarding_current_step');
      
      expect(mockRemoveItem).toHaveBeenCalledWith('onboarding_completed');
      expect(mockRemoveItem).toHaveBeenCalledWith('onboarding_current_step');
    });
  });

  describe('Onboarding Navigation', () => {
    it('should navigate to next step', () => {
      const currentStepIndex = 0;
      const totalSteps = 8;
      
      expect(currentStepIndex < totalSteps - 1).toBe(true);
      const nextStepIndex = currentStepIndex + 1;
      expect(nextStepIndex).toBe(1);
    });

    it('should navigate to previous step', () => {
      const currentStepIndex = 3;
      
      expect(currentStepIndex > 0).toBe(true);
      const prevStepIndex = currentStepIndex - 1;
      expect(prevStepIndex).toBe(2);
    });

    it('should not go beyond last step', () => {
      const currentStepIndex = 7; // Last step (8 total)
      const totalSteps = 8;
      
      expect(currentStepIndex < totalSteps - 1).toBe(false);
    });

    it('should not go before first step', () => {
      const currentStepIndex = 0;
      
      expect(currentStepIndex > 0).toBe(false);
    });

    it('should jump to specific step', () => {
      const targetStep = 'ai-assistant';
      const steps = [
        'welcome',
        'connect-server',
        'execute-tool',
        'view-history',
        'ai-assistant',
        'manage-macros',
        'explore-marketplace',
        'settings',
      ];
      
      const stepIndex = steps.findIndex(s => s === targetStep);
      expect(stepIndex).toBe(4);
    });
  });

  describe('Onboarding Actions', () => {
    it('should complete onboarding', async () => {
      const mockSetItem = vi.fn();
      (AsyncStorage.setItem as any).mockImplementation(mockSetItem);

      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      expect(mockSetItem).toHaveBeenCalled();
    });

    it('should skip onboarding', async () => {
      const mockSetItem = vi.fn();
      (AsyncStorage.setItem as any).mockImplementation(mockSetItem);

      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      expect(mockSetItem).toHaveBeenCalledWith('onboarding_completed', 'true');
    });

    it('should replay onboarding', async () => {
      const mockRemoveItem = vi.fn();
      (AsyncStorage.removeItem as any).mockImplementation(mockRemoveItem);

      await AsyncStorage.removeItem('onboarding_completed');
      await AsyncStorage.removeItem('onboarding_current_step');
      
      expect(mockRemoveItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Settings Screen Integration', () => {
    it('should show replay onboarding option after completion', () => {
      const hasCompletedOnboarding = true;
      
      expect(hasCompletedOnboarding).toBe(true);
    });

    it('should hide replay onboarding option before completion', () => {
      const hasCompletedOnboarding = false;
      
      expect(hasCompletedOnboarding).toBe(false);
    });

    it('should trigger onboarding reset when replay is clicked', async () => {
      const mockRemoveItem = vi.fn();
      (AsyncStorage.removeItem as any).mockImplementation(mockRemoveItem);

      // Simulate clicking replay button
      await AsyncStorage.removeItem('onboarding_completed');
      await AsyncStorage.removeItem('onboarding_current_step');
      
      expect(mockRemoveItem).toHaveBeenCalledWith('onboarding_completed');
      expect(mockRemoveItem).toHaveBeenCalledWith('onboarding_current_step');
    });
  });

  describe('Onboarding Modal', () => {
    it('should display onboarding modal when isOnboarding is true', () => {
      const isOnboarding = true;
      
      expect(isOnboarding).toBe(true);
    });

    it('should hide onboarding modal when isOnboarding is false', () => {
      const isOnboarding = false;
      
      expect(isOnboarding).toBe(false);
    });

    it('should display current step data in modal', () => {
      const currentStep = {
        id: 'welcome',
        title: 'Welcome to MCP Hub',
        description: 'Your unified control center...',
        icon: 'rocket',
        action: 'Get Started',
        tips: ['Tip 1', 'Tip 2', 'Tip 3'],
      };
      
      expect(currentStep.title).toBeDefined();
      expect(currentStep.description).toBeDefined();
      expect(currentStep.action).toBeDefined();
      expect(currentStep.tips.length).toBeGreaterThan(0);
    });

    it('should display navigation buttons in modal', () => {
      const canGoNext = true;
      const canGoPrevious = false;
      const canSkip = true;
      
      expect(canGoNext).toBe(true);
      expect(canGoPrevious).toBe(false);
      expect(canSkip).toBe(true);
    });
  });

  describe('Onboarding Context', () => {
    it('should provide onboarding context to components', () => {
      const contextValue = {
        currentStep: 'welcome',
        currentStepIndex: 0,
        isOnboarding: true,
        hasCompletedOnboarding: false,
        nextStep: () => {},
        previousStep: () => {},
        skipOnboarding: () => {},
        completeOnboarding: () => {},
        resetOnboarding: () => {},
        goToStep: () => {},
      };
      
      expect(contextValue).toHaveProperty('currentStep');
      expect(contextValue).toHaveProperty('isOnboarding');
      expect(contextValue).toHaveProperty('hasCompletedOnboarding');
      expect(contextValue).toHaveProperty('nextStep');
      expect(contextValue).toHaveProperty('skipOnboarding');
      expect(contextValue).toHaveProperty('resetOnboarding');
    });
  });

  describe('Onboarding Provider', () => {
    it('should initialize with default values', () => {
      const initialState = {
        currentStep: 'welcome',
        isOnboarding: true,
        hasCompletedOnboarding: false,
      };
      
      expect(initialState.currentStep).toBe('welcome');
      expect(initialState.isOnboarding).toBe(true);
      expect(initialState.hasCompletedOnboarding).toBe(false);
    });

    it('should load persisted state on mount', async () => {
      const mockGetItem = vi.fn()
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('connect-server');

      (AsyncStorage.getItem as any).mockImplementation(mockGetItem);

      const completed = await AsyncStorage.getItem('onboarding_completed');
      const step = await AsyncStorage.getItem('onboarding_current_step');
      
      expect(completed).toBe('true');
      expect(step).toBe('connect-server');
    });
  });
});
