import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Animation Utilities for Micro-interactions
 * Provides reusable animations for press feedback, transitions, and loading states
 */

export const AnimationPresets = {
  // Press feedback animations
  pressScale: {
    duration: 80,
    toValue: 0.97,
    easing: Easing.out(Easing.cubic),
  },
  pressOpacity: {
    duration: 80,
    toValue: 0.7,
    easing: Easing.out(Easing.cubic),
  },

  // Transition animations
  fadeIn: {
    duration: 300,
    toValue: 1,
    easing: Easing.out(Easing.cubic),
  },
  fadeOut: {
    duration: 300,
    toValue: 0,
    easing: Easing.in(Easing.cubic),
  },
  slideInUp: {
    duration: 400,
    toValue: 0,
    easing: Easing.out(Easing.cubic),
  },
  slideOutDown: {
    duration: 400,
    toValue: 100,
    easing: Easing.in(Easing.cubic),
  },

  // Loading animations
  spin: {
    duration: 1000,
    toValue: 1,
    easing: Easing.linear,
    isInteraction: false,
    useNativeDriver: true,
  },
  pulse: {
    duration: 1000,
    toValue: 0.6,
    easing: Easing.inOut(Easing.ease),
  },

  // Success/Error animations
  bounce: {
    duration: 400,
    toValue: 1,
    easing: Easing.out(Easing.back(1.2)),
  },
  shake: {
    duration: 300,
    toValue: 0,
    easing: Easing.out(Easing.cubic),
  },
};

/**
 * Create a scale animation for press feedback
 */
export function createPressAnimation() {
  const scaleValue = new Animated.Value(1);

  const onPressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.97,
      duration: 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return {
    scaleValue,
    onPressIn,
    onPressOut,
    animatedStyle: {
      transform: [{ scale: scaleValue }],
    },
  };
}

/**
 * Create a fade animation
 */
export function createFadeAnimation(initialValue = 0) {
  const fadeValue = new Animated.Value(initialValue);

  const fadeIn = () => {
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeValue, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return {
    fadeValue,
    fadeIn,
    fadeOut,
    animatedStyle: {
      opacity: fadeValue,
    },
  };
}

/**
 * Create a spin animation for loading states
 */
export function createSpinAnimation() {
  const spinValue = new Animated.Value(0);

  const startSpin = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  };

  const stopSpin = () => {
    spinValue.setValue(0);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {
    spinValue,
    startSpin,
    stopSpin,
    animatedStyle: {
      transform: [{ rotate: spin }],
    },
  };
}

/**
 * Create a pulse animation
 */
export function createPulseAnimation() {
  const pulseValue = new Animated.Value(1);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 0.6,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  return {
    pulseValue,
    startPulse,
    animatedStyle: {
      opacity: pulseValue,
    },
  };
}

/**
 * Create a slide animation
 */
export function createSlideAnimation(initialValue = 50) {
  const slideValue = new Animated.Value(initialValue);

  const slideIn = () => {
    Animated.timing(slideValue, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const slideOut = () => {
    Animated.timing(slideValue, {
      toValue: initialValue,
      duration: 400,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return {
    slideValue,
    slideIn,
    slideOut,
    animatedStyle: {
      transform: [{ translateY: slideValue }],
    },
  };
}

/**
 * Trigger haptic feedback based on interaction type
 */
export async function triggerHapticFeedback(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light',
) {
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    if (__DEV__) console.warn('Haptic feedback not available:', error);
  }
}
