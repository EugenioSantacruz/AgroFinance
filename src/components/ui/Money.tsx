import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { usePrivacy } from '../../context/PrivacyContext';
import { useTheme } from '../../context/ThemeContext';
import { CurrencyCode } from '../../types/domain';
import { formatMoney } from '../../utils/formatters';

interface MoneyProps {
  amount: number;
  currency: CurrencyCode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  tone?: 'default' | 'positive' | 'negative' | 'inverse';
  style?: StyleProp<TextStyle>;
}

export const Money: React.FC<MoneyProps> = ({
  amount,
  currency,
  size = 'md',
  tone = 'default',
  style,
}) => {
  const { isPrivate } = usePrivacy();
  const { theme } = useTheme();

  const fontSize = {
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    hero: 30,
  }[size];

  const color = {
    default: theme.textPrimary,
    positive: theme.success,
    negative: theme.danger,
    inverse: '#FFFFFF',
  }[tone];

  return (
    <Text
      style={[
        {
          fontSize,
          fontWeight: size === 'hero' || size === 'xl' ? '800' : '700',
          color,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
    >
      {formatMoney(amount, currency, isPrivate)}
    </Text>
  );
};

