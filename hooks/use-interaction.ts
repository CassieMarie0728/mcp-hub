import { useState, useCallback } from 'react';
import { Animated, Platform } from 'react-native';
import { createPressAnimation, triggerHapticFeedback } from '@/lib/animations';

/**
 * Hook for managing interactive states with animations and haptic feedback
 */
export function useInteraction() {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const { scaleValue, onPressIn, onPressOut, animatedStyle } = createPressAnimation();

  const handlePressIn = useCallback(async () => {
    if (isDisabled || isLoading) return;
    setIsPressed(true);
    onPressIn();
    if (Platform.OS !== 'web') {
      await triggerHapticFeedback('light');
    }
  }, [isDisabled, isLoading, onPressIn]);

  const handlePressOut = useCallback(() => {
    if (isDisabled || isLoading) return;
    setIsPressed(false);
    onPressOut();
  }, [isDisabled, isLoading, onPressOut]);

  const handleLoadingStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleLoadingEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleDisable = useCallback((disabled: boolean) => {
    setIsDisabled(disabled);
  }, []);

  return {
    isPressed,
    isLoading,
    isDisabled,
    scaleValue,
    animatedStyle,
    handlePressIn,
    handlePressOut,
    handleLoadingStart,
    handleLoadingEnd,
    handleDisable,
  };
}

/**
 * Hook for managing loading state with spinner animation
 */
export function useLoadingAnimation() {
  const [isLoading, setIsLoading] = useState(false);
  const spinValue = new Animated.Value(0);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinValue]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    spinValue.setValue(0);
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {
    isLoading,
    spinValue,
    spin,
    startLoading,
    stopLoading,
    animatedStyle: {
      transform: [{ rotate: spin }],
    },
  };
}

/**
 * Hook for managing success/error feedback animations
 */
export function useFeedbackAnimation() {
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const fadeValue = new Animated.Value(0);

  const showSuccess = useCallback(
    async (message?: string) => {
      setFeedbackType('success');
      setIsVisible(true);
      await triggerHapticFeedback('success');

      Animated.sequence([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setIsVisible(false));
    },
    [fadeValue],
  );

  const showError = useCallback(
    async (message?: string) => {
      setFeedbackType('error');
      setIsVisible(true);
      await triggerHapticFeedback('error');

      Animated.sequence([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setIsVisible(false));
    },
    [fadeValue],
  );

  return {
    feedbackType,
    isVisible,
    fadeValue,
    showSuccess,
    showError,
    animatedStyle: {
      opacity: fadeValue,
    },
  };
}
