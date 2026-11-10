import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AmbitoFiltro, AmbitoFinanciero, CurrencyCode } from '../../types/domain';
import { IconBadge } from './IconBadge';
import { Money } from './Money';
import { SyncStatus } from './SyncStatus';
import {
  HamsterLoader,
  SkeletonBox,
  SkeletonList,
  SkeletonPillarsGrid,
  SkeletonProgressList,
} from './Skeleton';

export {
  IconBadge,
  Money,
  SyncStatus,
  HamsterLoader,
  SkeletonBox,
  SkeletonList,
  SkeletonPillarsGrid,
  SkeletonProgressList,
};

/** Mensaje de error de validación mostrado debajo de un campo. */
export const FieldError: React.FC<{ message?: string | null }> = ({
  message,
}) => {
  const { theme } = useTheme();
  if (!message) return null;
  return (
    <Text
      accessibilityRole="alert"
      style={{
        color: theme.danger,
        fontSize: 12,
        fontWeight: '600',
        marginTop: -6,
      }}
    >
      {message}
    </Text>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}> = ({ children, style, onPress }) => {
  const { theme } = useTheme();
  const boxStyle = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.border },
    style,
  ];
  if (onPress) {
    return (
      <TouchableOpacity
        style={boxStyle}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={boxStyle}>{children}</View>;
};

export const SectionHeader: React.FC<{
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}> = ({ title, actionLabel, onActionPress }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        {title}
      </Text>
      {actionLabel && onActionPress ? (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={[styles.sectionAction, { color: theme.primary }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const AmbitoSwitch: React.FC<{
  value: AmbitoFiltro;
  onChange: (val: AmbitoFiltro) => void;
  includeAll?: boolean;
}> = ({ value, onChange, includeAll = true }) => {
  const { theme } = useTheme();
  const options: { key: AmbitoFiltro; label: string }[] = includeAll
    ? [
        { key: 'TODOS', label: 'Todos' },
        { key: 'NEGOCIO', label: 'Negocio (Maní)' },
        { key: 'PERSONAL', label: 'Personal' },
      ]
    : [
        { key: 'NEGOCIO', label: 'Negocio (Maní)' },
        { key: 'PERSONAL', label: 'Personal / Casa' },
      ];

  return (
    <View
      style={[
        styles.ambitoTrack,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}
    >
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected }}
            style={[
              styles.ambitoBtn,
              selected
                ? { backgroundColor: theme.primary }
                : { backgroundColor: 'transparent' },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.ambitoText,
                { color: selected ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const ScopeBadge: React.FC<{ scope: AmbitoFinanciero }> = ({ scope }) => {
  const { theme } = useTheme();
  const isNegocio = scope === 'NEGOCIO';
  return (
    <View
      style={[
        styles.currencyBadge,
        {
          backgroundColor: isNegocio ? theme.primarySoft : theme.accentGoldSoft,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: '800',
          color: isNegocio ? theme.primary : theme.accentGold,
        }}
      >
        {isNegocio ? 'NEGOCIO' : 'PERSONAL'}
      </Text>
    </View>
  );
};

export const Chip: React.FC<{
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
}> = ({ label, icon, selected = false, onPress }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      {icon ? (
        <IconBadge
          icon={icon}
          size={14}
          tone={selected ? 'inverse' : 'primary'}
        />
      ) : null}
      <Text
        style={[
          styles.chipText,
          { color: selected ? '#FFFFFF' : theme.textPrimary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const ListRow: React.FC<{
  icon: string;
  tone?: 'primary' | 'gold' | 'danger' | 'neutral';
  title: string;
  subtitle?: string;
  badgeText?: string;
  scope?: AmbitoFinanciero;
  amount?: number;
  currency?: CurrencyCode;
  amountTone?: 'default' | 'positive' | 'negative';
  secondaryRightText?: string;
  actionLabel?: string;
  actionTone?: 'primary' | 'gold' | 'danger';
  onActionPress?: () => void;
  onPress?: () => void;
}> = ({
  icon,
  tone = 'primary',
  title,
  subtitle,
  badgeText,
  scope,
  amount,
  currency = 'PYG',
  amountTone = 'default',
  secondaryRightText,
  actionLabel,
  actionTone = 'primary',
  onActionPress,
  onPress,
}) => {
  const { theme } = useTheme();
  const Container = onPress ? TouchableOpacity : View;

  const actionBg =
    actionTone === 'danger'
      ? theme.dangerSoft
      : actionTone === 'gold'
      ? theme.accentGoldSoft
      : theme.primarySoft;
  const actionFg =
    actionTone === 'danger'
      ? theme.danger
      : actionTone === 'gold'
      ? theme.accentGold
      : theme.primary;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.78}
      style={[
        styles.listRow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <IconBadge icon={icon} tone={tone} />
      <View style={styles.listRowCenter}>
        <View style={styles.titleLine}>
          <Text
            numberOfLines={1}
            style={[styles.rowTitle, { color: theme.textPrimary }]}
          >
            {title}
          </Text>
          {scope ? <ScopeBadge scope={scope} /> : null}
          {badgeText ? (
            <View
              style={[
                styles.currencyBadge,
                {
                  backgroundColor:
                    badgeText === 'USD' ? theme.usdBadgeBg : theme.pygBadgeBg,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color:
                    badgeText === 'USD'
                      ? theme.usdBadgeText
                      : theme.pygBadgeText,
                }}
              >
                {badgeText}
              </Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[styles.rowSub, { color: theme.textSecondary }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.listRowRight}>
        {typeof amount === 'number' ? (
          <Money amount={amount} currency={currency} tone={amountTone} />
        ) : null}
        {secondaryRightText ? (
          <Text style={[styles.secondaryRight, { color: theme.textMuted }]}>
            {secondaryRightText}
          </Text>
        ) : null}
        {actionLabel && onActionPress ? (
          <TouchableOpacity
            onPress={(e) => {
              (e as any)?.stopPropagation?.();
              onActionPress();
            }}
            activeOpacity={0.8}
            style={[styles.inlineActionBtn, { backgroundColor: actionBg }]}
          >
            <Text style={[styles.inlineActionText, { color: actionFg }]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {onPress ? <ChevronRight size={16} color={theme.textMuted} /> : null}
    </Container>
  );
};

export const SecureButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string;
}> = ({ label, onPress, disabled = false, variant = 'primary', icon }) => {
  const { theme } = useTheme();
  const bg =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
      ? theme.danger
      : theme.surfaceMuted;
  const fg = variant === 'secondary' ? theme.textPrimary : '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.secureButton,
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {icon ? <IconBadge icon={icon} size={16} tone="inverse" /> : null}
      <Text style={[styles.secureButtonText, { color: fg }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export const AmountInput: React.FC<{
  value: string;
  onChangeText: (val: string) => void;
  currency: CurrencyCode;
  onToggleCurrency?: () => void;
  label?: string;
  error?: string | null;
}> = ({
  value,
  onChangeText,
  currency,
  onToggleCurrency,
  label = 'MONTO EN MONEDA NATIVA',
  error,
}) => {
  const { theme } = useTheme();
  return (
    <>
    <View
      style={[
        styles.amountBox,
        {
          backgroundColor: theme.surface,
          borderColor: error ? theme.danger : theme.borderStrong,
        },
      ]}
    >
      <View style={styles.amountHeaderRow}>
        <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
          {label}
        </Text>
        {onToggleCurrency ? (
          <TouchableOpacity
            onPress={onToggleCurrency}
            accessibilityRole="button"
            accessibilityLabel={
              currency === 'USD'
                ? 'Moneda dólares. Cambiar a guaraníes'
                : 'Moneda guaraníes. Cambiar a dólares'
            }
            style={[
              styles.currencySwitch,
              {
                backgroundColor:
                  currency === 'USD' ? theme.usdBadgeBg : theme.pygBadgeBg,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color:
                  currency === 'USD'
                    ? theme.usdBadgeText
                    : theme.pygBadgeText,
              }}
            >
              {currency === 'USD'
                ? 'US$ DÓLARES (Cambiar a PYG)'
                : 'Gs. GUARANÍES (Cambiar a USD)'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.amountInputRow}>
        <Text style={[styles.currencySymbol, { color: theme.primary }]}>
          {currency === 'USD' ? 'US$' : 'Gs.'}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          accessibilityLabel={label}
          placeholder={currency === 'USD' ? '0.00' : '0'}
          placeholderTextColor={theme.textMuted}
          style={[styles.amountInputText, { color: theme.textPrimary }]}
        />
      </View>
    </View>
    <FieldError message={error} />
    </>
  );
};

export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description: string;
}> = ({ icon = 'Layers', title, description }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.emptyBox,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <IconBadge icon={icon} tone="neutral" />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  ambitoTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  ambitoBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambitoText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  listRowCenter: {
    flex: 1,
    gap: 3,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  currencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  rowSub: {
    fontSize: 12,
  },
  listRowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  secondaryRight: {
    fontSize: 11,
    fontWeight: '500',
  },
  inlineActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  inlineActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  secureButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  secureButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  amountBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  amountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  currencySwitch: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '800',
  },
  amountInputText: {
    flex: 1,
    fontSize: 30,
    fontWeight: '800',
    paddingVertical: 4,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
});
