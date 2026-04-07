import React, { ReactNode, ReactElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactElement;
  onError?: (error: Error, errorInfo: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

/**
 * Error Boundary Component
 * Catches React errors and displays a graceful error UI
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: error.toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (__DEV__) {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo.componentStack || '');
    }

    // Update state with error details
    this.setState({
      hasError: true,
      error,
      errorInfo: errorInfo.componentStack || error.toString(),
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: '',
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} onRetry={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  onRetry,
}: {
  error: Error;
  errorInfo: string;
  onRetry: () => void;
}): ReactElement {
  const colors = useColors();

  return (
    <View className="flex-1 bg-background justify-center items-center p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        {/* Error Icon */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-error/20 items-center justify-center mb-4">
            <MaterialIcons name="error-outline" size={32} color={colors.error} />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">Oops! Something went wrong</Text>
        </View>

        {/* Error Message */}
        <View className="bg-error/10 rounded-lg p-4 mb-6 border border-error/30">
          <Text className="text-sm font-semibold text-error mb-2">Error Details:</Text>
          <Text className="text-xs text-error font-mono">{error.message}</Text>
        </View>

        {/* Stack Trace (Development Only) */}
        {__DEV__ && errorInfo && (
          <View className="bg-surface rounded-lg p-4 mb-6 border border-border max-h-40">
            <Text className="text-xs font-semibold text-muted mb-2">Stack Trace:</Text>
            <ScrollView>
              <Text className="text-xs text-muted font-mono">{errorInfo}</Text>
            </ScrollView>
          </View>
        )}

        {/* Recovery Suggestions */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">What you can try:</Text>
          <View className="gap-2">
            <Text className="text-sm text-muted">• Tap "Retry" to try again</Text>
            <Text className="text-sm text-muted">• Close and reopen the app</Text>
            <Text className="text-sm text-muted">• Check your internet connection</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={onRetry}
            className="bg-primary rounded-lg py-3 px-6 items-center active:opacity-80"
          >
            <Text className="text-background font-semibold">Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Navigate to home or restart app
              console.log('Navigating to home...');
            }}
            className="bg-surface rounded-lg py-3 px-6 items-center border border-border active:opacity-80"
          >
            <Text className="text-foreground font-semibold">Go Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Tool Execution Error Boundary
 * Specialized error boundary for tool execution errors
 */
export function ToolExecutionErrorBoundary({
  children,
  toolName,
  onError,
}: {
  children: ReactNode;
  toolName?: string;
  onError?: (error: Error) => void;
}): ReactElement {
  return (
    <ErrorBoundary
      onError={(error) => {
        if (onError) {
          onError(error);
        }
      }}
      fallback={(error, retry) => (
        <ToolExecutionErrorFallback error={error} toolName={toolName} onRetry={retry} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Tool Execution Error Fallback UI
 */
function ToolExecutionErrorFallback({
  error,
  toolName,
  onRetry,
}: {
  error: Error;
  toolName?: string;
  onRetry: () => void;
}): ReactElement {
  const colors = useColors();

  return (
    <View className="bg-error/10 rounded-lg p-4 border border-error/30">
      <View className="flex-row items-start gap-3">
        <MaterialIcons name="warning" size={20} color={colors.error} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-error mb-1">
            {toolName ? `${toolName} failed` : 'Tool execution failed'}
          </Text>
          <Text className="text-xs text-error mb-3">{error.message}</Text>
          <TouchableOpacity
            onPress={onRetry}
            className="bg-error rounded-md py-2 px-3 self-start active:opacity-80"
          >
            <Text className="text-white text-xs font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/**
 * Macro Execution Error Boundary
 * Specialized error boundary for macro execution errors
 */
export function MacroExecutionErrorBoundary({
  children,
  macroName,
  onError,
}: {
  children: ReactNode;
  macroName?: string;
  onError?: (error: Error) => void;
}): ReactElement {
  return (
    <ErrorBoundary
      onError={(error) => {
        if (onError) {
          onError(error);
        }
      }}
      fallback={(error, retry) => (
        <MacroExecutionErrorFallback error={error} macroName={macroName} onRetry={retry} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Macro Execution Error Fallback UI
 */
function MacroExecutionErrorFallback({
  error,
  macroName,
  onRetry,
}: {
  error: Error;
  macroName?: string;
  onRetry: () => void;
}): ReactElement {
  const colors = useColors();

  return (
    <View className="bg-error/10 rounded-lg p-4 border border-error/30">
      <View className="flex-row items-start gap-3">
        <MaterialIcons name="error-outline" size={20} color={colors.error} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-error mb-1">
            {macroName ? `Macro "${macroName}" failed` : 'Macro execution failed'}
          </Text>
          <Text className="text-xs text-error mb-3">{error.message}</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onRetry}
              className="bg-error rounded-md py-2 px-3 flex-1 items-center active:opacity-80"
            >
              <Text className="text-white text-xs font-semibold">Retry Macro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                console.log('Pausing macro...');
              }}
              className="bg-surface rounded-md py-2 px-3 flex-1 items-center border border-border active:opacity-80"
            >
              <Text className="text-foreground text-xs font-semibold">Pause</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
