import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getAgroIcon } from '../../utils/icons';

interface IconBadgeProps {
  icon: string;
  size?: number;
  tone?: 'primary' | 'gold' | 'danger' | 'neutral' | 'inverse';
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  size = 18,
  tone = 'primary',
}) => {
  const { theme } = useTheme();
  const IconComp = getAgroIcon(icon);

  const palette = {
    primary: { bg: theme.primarySoft, fg: theme.primary },
    gold: { bg: theme.accentGoldSoft, fg: theme.accentGold },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
    neutral: { bg: theme.surfaceMuted, fg: theme.textSecondary },
    inverse: { bg: 'rgba(255,255,255,0.14)', fg: '#6EE7B7' },
  }[tone];

  return (
    <View style={[styles.box, { backgroundColor: palette.bg }]}>
      <IconComp size={size} color={palette.fg} />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

