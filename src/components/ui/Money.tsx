import React, { useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { APP_CONFIG } from '../../constants/config';
import { usePrivacy } from '../../context/PrivacyContext';
import { useTheme } from '../../context/ThemeContext';
import { useCotizacion } from '../../hooks/useCotizacion';
import { CurrencyCode } from '../../types/domain';
import { convertCurrency, formatMoney } from '../../utils/formatters';

interface MoneyProps {
  amount: number;
  currency: CurrencyCode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  tone?: 'default' | 'positive' | 'negative' | 'inverse';
  style?: StyleProp<TextStyle>;
  /** Si es true (por defecto), un toque alterna PYG/USD usando la cotización vigente. */
  convertible?: boolean;
}

export const Money: React.FC<MoneyProps> = ({
  amount,
  currency,
  size = 'md',
  tone = 'default',
  style,
  convertible = true,
}) => {
  const { isPrivate } = usePrivacy();
  const { theme } = useTheme();
  const { data: cotizacion } = useCotizacion();
  const [flipped, setFlipped] = useState(false);

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

  const canFlip = convertible && !isPrivate;
  const showFlipped = canFlip && flipped;
  const otherCurrency: CurrencyCode = currency === 'USD' ? 'PYG' : 'USD';
  const tasa = cotizacion?.referenciaBCP || APP_CONFIG.DEFAULT_EXCHANGE_RATE;

  const shownAmount = showFlipped
    ? convertCurrency(amount, currency, otherCurrency, tasa)
    : amount;
  const shownCurrency = showFlipped ? otherCurrency : currency;
  const text = formatMoney(shownAmount, shownCurrency, isPrivate);

  return (
    <Text
      onPress={canFlip ? () => setFlipped((v) => !v) : undefined}
      accessibilityRole={canFlip ? 'button' : undefined}
      accessibilityLabel={
        canFlip
          ? `${text}. Tocar para ver en ${
              showFlipped ? currency : otherCurrency
            }`
          : undefined
      }
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
      {showFlipped ? '≈ ' : ''}
      {text}
    </Text>
  );
};
