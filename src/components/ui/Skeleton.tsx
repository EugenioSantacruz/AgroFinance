import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export const SkeletonBox: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
}> = ({ width = '100%', height = 18, borderRadius = 8 }) => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 650,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius,
        backgroundColor: theme.skeletonBase,
        opacity,
      }}
    />
  );
};

export const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.rowCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SkeletonBox width={38} height={38} borderRadius={11} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="65%" height={14} />
            <SkeletonBox width="40%" height={11} />
          </View>
          <SkeletonBox width={85} height={16} />
        </View>
      ))}
    </View>
  );
};

export const SkeletonProgressList: React.FC<{ rows?: number }> = ({
  rows = 3,
}) => {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.progressCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SkeletonBox width="55%" height={14} />
            <SkeletonBox width={50} height={14} />
          </View>
          <SkeletonBox width="100%" height={8} borderRadius={4} />
        </View>
      ))}
    </View>
  );
};

export const SkeletonPillarsGrid: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.gridItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SkeletonBox width={34} height={34} borderRadius={10} />
          <SkeletonBox width="70%" height={12} />
          <SkeletonBox width="90%" height={18} />
        </View>
      ))}
    </View>
  );
};

export const HamsterLoader: React.FC<{ message?: string }> = ({
  message = 'Sincronizando libro contable en Google Sheets...',
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.loaderBox,
          { backgroundColor: theme.surface, borderColor: theme.borderStrong },
        ]}
      >
        <View
          style={[
            styles.spinnerBadge,
            { backgroundColor: theme.primarySoft },
          ]}
        >
          <RefreshCw size={26} color={theme.primary} />
        </View>
        <Text style={[styles.loaderTitle, { color: theme.textPrimary }]}>
          Procesando Transacción Agro
        </Text>
        <Text style={[styles.loaderSub, { color: theme.textSecondary }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  progressCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  gridItem: {
    width: '48.5%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6, 24, 18, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  loaderBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  spinnerBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  loaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  loaderSub: {
    fontSize: 13,
    textAlign: 'center',
  },
});

