import React, { createContext, useContext, useState } from 'react';

interface AIAssistantContextType {
  isOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function useAIAssistant(): AIAssistantContextType {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return context;
}

interface AIAssistantProviderProps {
  children: React.ReactNode;
}

export function AIAssistantProvider(props: AIAssistantProviderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const openAssistant = () => setIsOpen(true);
  const closeAssistant = () => setIsOpen(false);
  const toggleAssistant = () => setIsOpen((prev) => !prev);

  const value: AIAssistantContextType = {
    isOpen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
  };

  return React.createElement(AIAssistantContext.Provider, { value }, props.children);
}
