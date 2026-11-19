import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { usePrivacy } from '../context/PrivacyContext';
import { useTheme } from '../context/ThemeContext';
import { IconBadge, Money, SkeletonBox, SyncStatus } from '../components/ui';
import { CurrencyCode } from '../types/domain';
import { useBreakpoint } from '../hooks/useBreakpoint';

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface BaseContainerTemplateProps {
  title: string;
  subtitle?: string;
  isSyncing?: boolean;
  isLoadingHero?: boolean;
  heroLabel: string;
  heroAmount: number;
  heroCurrency: CurrencyCode;
  heroSecondaryLabel?: string;
  heroSecondaryAmount?: number;
  heroSecondaryCurrency?: CurrencyCode;
  exchangeRateBadge?: string;
  quickActions?: QuickActionItem[];
  onRefresh?: () => void;
  children: React.ReactNode;
}

export const BaseContainerTemplate: React.FC<BaseContainerTemplateProps> = ({
  title,
  subtitle,
  isSyncing = false,
  isLoadingHero = false,
  heroLabel,
  heroAmount,
  heroCurrency,
  heroSecondaryLabel,
  heroSecondaryAmount,
  heroSecondaryCurrency,
  exchangeRateBadge,
  quickActions = [],
  onRefresh,
  children,
}) => {
  const { theme } = useTheme();
  const { isDesktop, contentMaxWidth } = useBreakpoint();
  const {
    isPrivate,
    togglePrivacy,
    displayCurrency,
    toggleDisplayCurrency,
  } = usePrivacy();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* TopBar Ejecutiva */}
      <View
        style={[
          styles.topBar,
          isDesktop && styles.topBarDesktop,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.topBarLeft}>
          <View style={styles.brandRow}>
            <ShieldCheck size={isDesktop ? 20 : 18} color={theme.primary} />
            <Text
              style={[
                styles.topTitle,
                isDesktop && { fontSize: 18 },
                { color: theme.textPrimary },
              ]}
            >
              {title}
            </Text>
          </View>
          {subtitle ? (
            <Text style={[styles.topSubtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.topBarRight}>
          <SyncStatus isSyncing={isSyncing} />

          <TouchableOpacity
            onPress={toggleDisplayCurrency}
            accessibilityRole="button"
            accessibilityLabel={`Moneda de visualización ${displayCurrency}. Tocar para cambiar`}
            style={[
              styles.currencyPill,
              {
                backgroundColor:
                  displayCurrency === 'USD'
                    ? theme.usdBadgeBg
                    : theme.pygBadgeBg,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color:
                  displayCurrency === 'USD'
                    ? theme.usdBadgeText
                    : theme.pygBadgeText,
              }}
            >
              {displayCurrency}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePrivacy}
            accessibilityRole="button"
            accessibilityLabel={isPrivate ? 'Mostrar montos' : 'Ocultar montos'}
            style={[
              styles.iconBtn,
              { backgroundColor: theme.surfaceMuted },
            ]}
          >
            {isPrivate ? (
              <EyeOff size={18} color={theme.textPrimary} />
            ) : (
              <Eye size={18} color={theme.textPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: contentMaxWidth, padding: isDesktop ? 24 : 16 },
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          ) : undefined
        }
      >
        {/* Hero Card Patrimonial con soporte Desktop & Mobile */}
        <View
          style={[
            styles.heroCard,
            isDesktop && styles.heroCardDesktop,
            {
              backgroundColor: theme.heroBackground,
              borderColor: theme.heroBorder,
            },
          ]}
        >
          {/* Columna de Datos Numéricos */}
          <View style={[isDesktop && styles.heroLeftColDesktop]}>
            <View style={styles.heroHeaderRow}>
              <Text style={styles.heroLabel}>{heroLabel}</Text>
              {exchangeRateBadge ? (
                <View style={styles.rateBadge}>
                  <Text style={styles.rateBadgeText}>{exchangeRateBadge}</Text>
                </View>
              ) : null}
            </View>

            {isLoadingHero ? (
              <View style={{ gap: 10, paddingVertical: 6 }}>
                <SkeletonBox width="70%" height={34} borderRadius={10} />
                <SkeletonBox width="48%" height={18} borderRadius={6} />
              </View>
            ) : (
              <View style={{ gap: 4, marginTop: 4 }}>
                <Money
                  amount={heroAmount}
                  currency={heroCurrency}
                  size={isDesktop ? 'hero' : 'hero'}
                  tone="inverse"
                />
                {typeof heroSecondaryAmount === 'number' &&
                heroSecondaryCurrency ? (
                  <View style={styles.heroSecondaryRow}>
                    <Text style={styles.heroSecondaryLabel}>
                      {heroSecondaryLabel || 'Equivalente Bimoneda:'}
                    </Text>
                    <Money
                      amount={heroSecondaryAmount}
                      currency={heroSecondaryCurrency}
                      size="sm"
                      tone="inverse"
                    />
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Grilla / Fila de Acciones Rápidas */}
          {quickActions.length > 0 ? (
            <View
              style={[
                styles.actionsGrid,
                isDesktop && styles.actionsGridDesktop,
              ]}
            >
              {quickActions.map((act) => (
                <TouchableOpacity
                  key={act.id}
                  style={[
                    styles.actionButton,
                    isDesktop && styles.actionButtonDesktop,
                  ]}
                  onPress={act.onPress}
                  activeOpacity={0.8}
                >
                  <IconBadge icon={act.icon} size={18} tone="inverse" />
                  <Text numberOfLines={1} style={styles.actionLabel}>
                    {act.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarDesktop: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  topBarLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  topSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 48,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  heroCardDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  heroLeftColDesktop: {
    flex: 1.2,
    gap: 8,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroLabel: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rateBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rateBadgeText: {
    color: '#ECFDF5',
    fontSize: 11,
    fontWeight: '700',
  },
  heroSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  heroSecondaryLabel: {
    color: '#A7F3D0',
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  actionsGridDesktop: {
    flex: 1,
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
    gap: 10,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionButtonDesktop: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    maxWidth: 130,
  },
  actionLabel: {
    color: '#ECFDF5',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
