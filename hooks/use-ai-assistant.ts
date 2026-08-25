import React, { createContext, useContext, useState } from "react";

interface AIAssistantContextType {
  isOpen: boolean;
  openAssistant: () => void;
  openAssistantWithRetry: (retryRequestId: string) => void;
  closeAssistant: () => void;
  clearRetryRequest: () => void;
  toggleAssistant: () => void;
  retryRequestId: string | null;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function useAIAssistant(): AIAssistantContextType {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error("useAIAssistant must be used within AIAssistantProvider");
  }
  return context;
}

interface AIAssistantProviderProps {
  children: React.ReactNode;
}

export function AIAssistantProvider(props: AIAssistantProviderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [retryRequestId, setRetryRequestId] = useState<string | null>(null);

  const openAssistant = () => { setRetryRequestId(null); setIsOpen(true); };
  const openAssistantWithRetry = (retryId: string) => { setRetryRequestId(retryId); setIsOpen(true); };
  const closeAssistant = () => { setRetryRequestId(null); setIsOpen(false); };
  const clearRetryRequest = () => setRetryRequestId(null);
  const toggleAssistant = () => setIsOpen((prev) => !prev);

  const value: AIAssistantContextType = {
    isOpen,
    openAssistant,
    openAssistantWithRetry,
    closeAssistant,
    clearRetryRequest,
    toggleAssistant,
    retryRequestId,
  };

  return React.createElement(
    AIAssistantContext.Provider,
    { value },
    props.children
  );
}
