import React, { useEffect } from 'react';
import { View, Animated } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Skeleton Component for loading states
 * Displays animated placeholder while data loads
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className,
  animated = true,
}: SkeletonProps) {
  const colors = useColors();
  const opacity = new Animated.Value(0.6);

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity, animated]);

  return (
    <Animated.View
      style={[
        {
          width: typeof width === 'string' ? width : (width as number),
          height: typeof height === 'string' ? height : (height as number),
          borderRadius,
          backgroundColor: colors.surface,
          opacity: animated ? opacity : 0.6,
        } as any,
      ]}
      className={className}
    />
  );
}

/**
 * Skeleton Card for loading list items
 */
export function SkeletonCard() {
  return (
    <View className="bg-surface rounded-lg p-4 mb-3 gap-3">
      <View className="flex-row items-center gap-3">
        <Skeleton width={48} height={48} borderRadius={8} />
        <View className="flex-1 gap-2">
          <Skeleton width="70%" height={12} />
          <Skeleton width="50%" height={10} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton List for loading multiple items
 */
interface SkeletonListProps {
  count?: number;
  type?: 'card' | 'line' | 'avatar';
}

export function SkeletonList({ count = 5, type = 'card' }: SkeletonListProps) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          {type === 'card' && <SkeletonCard />}
          {type === 'line' && <Skeleton height={12} className="mb-2" />}
          {type === 'avatar' && (
            <View className="flex-row items-center gap-3 mb-3">
              <Skeleton width={40} height={40} borderRadius={20} />
              <Skeleton width="60%" height={12} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton Table Row for data tables
 */
export function SkeletonTableRow() {
  return (
    <View className="flex-row gap-3 mb-3 items-center">
      <Skeleton width="25%" height={12} />
      <Skeleton width="25%" height={12} />
      <Skeleton width="25%" height={12} />
      <Skeleton width="25%" height={12} />
    </View>
  );
}

/**
 * Skeleton Header for screens
 */
export function SkeletonHeader() {
  return (
    <View className="gap-3 mb-6">
      <Skeleton width="60%" height={32} borderRadius={8} />
      <Skeleton width="80%" height={14} borderRadius={8} />
    </View>
  );
}

/**
 * Skeleton Stats Grid
 */
export function SkeletonStatsGrid() {
  return (
    <View className="flex-row gap-3 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} className="flex-1 bg-surface rounded-lg p-4 gap-2 items-center">
          <Skeleton width={24} height={24} borderRadius={4} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={12} />
        </View>
      ))}
    </View>
  );
}
