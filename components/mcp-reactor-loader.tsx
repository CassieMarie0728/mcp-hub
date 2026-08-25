import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';

type MCPReactorLoaderProps = {
  label?: string;
  compact?: boolean;
};

/**
 * A restrained branded loading signal for work that is genuinely in progress.
 * It deliberately does not imply that an action has succeeded or a tool has run.
 */
export function MCPReactorLoader({
  label = 'Warming the command bunker…',
  compact = false,
}: MCPReactorLoaderProps) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.82,
          duration: 760,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const coreSize = compact ? 36 : 56;
  const ringSize = compact ? 48 : 74;

  return (
    <View
      className={compact ? 'items-center justify-center gap-2' : 'items-center justify-center gap-3'}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <View style={{ width: ringSize, height: ringSize }} className="items-center justify-center">
        <Animated.View
          className="absolute rounded-full border-2 border-primary"
          style={{
            width: ringSize,
            height: ringSize,
            opacity: 0.5,
            transform: [{ scale: pulse }],
          }}
        />
        <View
          className="rounded-full items-center justify-center overflow-hidden"
          style={{
            width: coreSize,
            height: coreSize,
            backgroundColor: `${colors.primary}24`,
          }}
        >
          <Image
            source={require('../assets/images/icon.png')}
            resizeMode="cover"
            style={{ width: coreSize, height: coreSize }}
          />
        </View>
      </View>
      {!compact ? <Text className="text-sm text-muted font-medium">{label}</Text> : null}
    </View>
  );
}
