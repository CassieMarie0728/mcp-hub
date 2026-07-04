import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OnboardingStep = 
  | 'welcome'
  | 'connect-server'
  | 'execute-tool'
  | 'view-history'
  | 'ai-assistant'
  | 'manage-macros'
  | 'explore-marketplace'
  | 'settings'
  | 'complete';

export interface OnboardingStepData {
  id: OnboardingStep;
  title: string;
  description: string;
  icon: string;
  action: string;
  tips: string[];
  videoUrl?: string;
}

const ONBOARDING_STEPS: OnboardingStepData[] = [
  {
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
  },
  {
    id: 'connect-server',
    title: 'Connect Your First Server',
    description: 'Add an MCP server to start managing tools. You can connect multiple servers and switch between them.',
    icon: 'server',
    action: 'Add Server',
    tips: [
      'Go to the "Servers" tab to add a new server',
      'Enter your server URL and authentication details',
      'Test the connection before saving',
      'You can edit or remove servers anytime',
    ],
  },
  {
    id: 'execute-tool',
    title: 'Execute Your First Tool',
    description: 'Browse available tools from your connected servers and execute them with custom parameters.',
    icon: 'flash',
    action: 'Explore Tools',
    tips: [
      'Select a tool from your connected server',
      'Fill in the required parameters',
      'View real-time execution results',
      'Save frequently used tool combinations as macros',
    ],
  },
  {
    id: 'view-history',
    title: 'Track Execution History',
    description: 'Every tool execution is logged. Review results, debug issues, and learn from past runs.',
    icon: 'history',
    action: 'View History',
    tips: [
      'Access execution history from the home screen',
      'Filter by server, tool, or date range',
      'View detailed logs for each execution',
      'Export results for analysis or sharing',
    ],
  },
  {
    id: 'ai-assistant',
    title: 'Meet Your AI Assistant',
    description: 'Get intelligent suggestions, help with tool parameters, and answers to your questions about MCP Hub.',
    icon: 'sparkles',
    action: 'Open Assistant',
    tips: [
      'Tap the AI icon to open the assistant chat',
      'Ask questions about tools or workflows',
      'Get help writing complex tool parameters',
      'The assistant learns from your usage patterns',
    ],
  },
  {
    id: 'manage-macros',
    title: 'Create Macros',
    description: 'Save sequences of tool executions as macros to automate repetitive workflows and save time.',
    icon: 'layers',
    action: 'Create Macro',
    tips: [
      'Go to the "Builder" tab to create macros',
      'Chain multiple tools together',
      'Set conditions and loops for complex workflows',
      'Share macros with your team',
    ],
  },
  {
    id: 'explore-marketplace',
    title: 'Explore the Marketplace',
    description: 'Discover pre-built macros, templates, and integrations created by the community.',
    icon: 'shopping-bag',
    action: 'Browse Marketplace',
    tips: [
      'Find ready-to-use macros for common tasks',
      'Rate and review community contributions',
      'Share your own macros with others',
      'Get inspiration from popular workflows',
    ],
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Configure notifications, security, integrations, and preferences to match your workflow.',
    icon: 'settings',
    action: 'Open Settings',
    tips: [
      'Enable push notifications for important events',
      'Set up two-factor authentication',
      'Configure API integrations',
      'Customize your dashboard layout',
    ],
  },
];

interface OnboardingContextType {
  currentStep: OnboardingStep;
  currentStepIndex: number;
  isOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  stepData: OnboardingStepData;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  goToStep: (step: OnboardingStep) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from storage on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        const savedStep = await AsyncStorage.getItem('onboarding_current_step');
        
        if (completed === 'true') {
          setHasCompletedOnboarding(true);
          setIsOnboarding(false);
        } else if (savedStep) {
          setCurrentStep(savedStep as OnboardingStep);
          setIsOnboarding(true);
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingState();
  }, []);

  // Save current step to storage whenever it changes
  useEffect(() => {
    const saveStep = async () => {
      try {
        await AsyncStorage.setItem('onboarding_current_step', currentStep);
      } catch (error) {
        console.error('Failed to save onboarding step:', error);
      }
    };

    if (!isLoading) {
      saveStep();
    }
  }, [currentStep, isLoading]);

  const currentStepIndex = ONBOARDING_STEPS.findIndex(s => s.id === currentStep);
  const stepData = ONBOARDING_STEPS[currentStepIndex] || ONBOARDING_STEPS[0];

  const nextStep = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      const nextStepData = ONBOARDING_STEPS[currentStepIndex + 1];
      setCurrentStep(nextStepData.id);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const prevStepData = ONBOARDING_STEPS[currentStepIndex - 1];
      setCurrentStep(prevStepData.id);
    }
  };

  const skipOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setHasCompletedOnboarding(true);
      setIsOnboarding(false);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setHasCompletedOnboarding(true);
      setIsOnboarding(false);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_completed');
      await AsyncStorage.removeItem('onboarding_current_step');
      setCurrentStep('welcome');
      setHasCompletedOnboarding(false);
      setIsOnboarding(true);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  };

  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        currentStepIndex,
        isOnboarding,
        hasCompletedOnboarding,
        stepData,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        resetOnboarding,
        goToStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
