import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
  CalendarClock,
  Eye,
  EyeOff,
  Landmark,
  Moon,
  Plus,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Coins,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { usePrivacy } from '../../context/PrivacyContext';
import { SyncStatus } from '../ui/SyncStatus';

interface NavItem {
  id: string;
  name: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'patrimonio',
    name: 'index',
    label: 'Patrimonio',
    subtitle: 'Consolidado Bimoneda & Cuentas',
    icon: Landmark,
    path: '/(tabs)',
  },
  {
    id: 'historial',
    name: 'historial',
    label: 'Libro Diario',
    subtitle: 'Asientos, Ingresos & Gastos',
    icon: Receipt,
    path: '/(tabs)/historial',
  },
  {
    id: 'resumen',
    name: 'resumen',
    label: 'Agenda & Caja',
    subtitle: 'Flujo 30D & Vencimientos',
    icon: CalendarClock,
    path: '/(tabs)/resumen',
  },
  {
    id: 'ajustes',
    name: 'ajustes',
    label: 'Ajustes',
    subtitle: 'Campaña, Tasas & Sistema',
    icon: SlidersHorizontal,
    path: '/(tabs)/ajustes',
  },
];

export const DesktopSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark, toggleTheme } = useTheme();
  const {
    isPrivate,
    togglePrivacy,
    displayCurrency,
    toggleDisplayCurrency,
  } = usePrivacy();

  const isItemActive = (item: NavItem) => {
    if (item.name === 'index') {
      return (
        pathname === '/' ||
        pathname === '/(tabs)' ||
        pathname === '/(tabs)/index'
      );
    }
    return pathname.includes(item.name);
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.surface,
          borderRightColor: theme.border,
        },
      ]}
    >
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.brandRow}>
          <View
            style={[
              styles.brandIconBox,
              { backgroundColor: theme.primarySoft },
            ]}
          >
            <ShieldCheck size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              AgroFinance
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
              Gestión Bimoneda PY
            </Text>
          </View>
        </View>

        {/* Campaña badge */}
        <View
          style={[
            styles.campanaBadge,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          ]}
        >
          <View
            style={[styles.campanaDot, { backgroundColor: theme.primary }]}
          />
          <Text
            style={[styles.campanaText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            Campaña 2025/2026
          </Text>
        </View>
      </View>

      {/* Botón Principal Registrar Movimiento */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          onPress={() => router.push('/(modals)/registrar' as never)}
          activeOpacity={0.85}
          style={[
            styles.registerBtn,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Registrar nuevo movimiento"
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.8} />
          <Text style={styles.registerBtnText}>+ Asiento / Registro</Text>
        </TouchableOpacity>
      </View>

      {/* Navegación Principal */}
      <View style={styles.navSection}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          MÓDULOS DEL SISTEMA
        </Text>
        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.replace(item.path as never)}
                activeOpacity={0.78}
                style={[
                  styles.navItem,
                  active && {
                    backgroundColor: theme.primarySoft,
                    borderLeftColor: theme.primary,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Icon
                  size={20}
                  color={active ? theme.primary : theme.textSecondary}
                />
                <View style={styles.navItemContent}>
                  <Text
                    style={[
                      styles.navItemLabel,
                      {
                        color: active ? theme.primary : theme.textPrimary,
                        fontWeight: active ? '800' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.navItemSub,
                      {
                        color: active ? theme.textSecondary : theme.textMuted,
                      },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Accesos Rápidos Extras */}
      <View style={styles.quickLinksSection}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          ACCIONES RÁPIDAS
        </Text>
        <View style={{ gap: 6 }}>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/transferir' as never)}
            style={[styles.smallQuickBtn, { backgroundColor: theme.surfaceMuted }]}
          >
            <Text style={[styles.smallQuickText, { color: theme.textPrimary }]}>
              ⇄ Transferir entre Cuentas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/cotizacion' as never)}
            style={[styles.smallQuickBtn, { backgroundColor: theme.surfaceMuted }]}
          >
            <Coins size={14} color={theme.textSecondary} />
            <Text style={[styles.smallQuickText, { color: theme.textPrimary }]}>
              Tasa BCP / Cotización
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Sidebar Footer: Herramientas del Sistema */}
      <View
        style={[
          styles.footerContainer,
          { borderTopColor: theme.border },
        ]}
      >
        {/* Sync Status */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
            Conexión
          </Text>
          <SyncStatus />
        </View>

        {/* Currency Switcher */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
            Moneda Vista
          </Text>
          <TouchableOpacity
            onPress={toggleDisplayCurrency}
            activeOpacity={0.8}
            style={[
              styles.footerTogglePill,
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
              {displayCurrency === 'USD' ? '$ USD' : 'Gs. PYG'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Controls Row: Privacy & Theme */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={togglePrivacy}
            activeOpacity={0.8}
            style={[
              styles.controlBtn,
              { backgroundColor: theme.surfaceMuted },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isPrivate ? 'Mostrar montos' : 'Ocultar montos'}
          >
            {isPrivate ? (
              <EyeOff size={16} color={theme.textPrimary} />
            ) : (
              <Eye size={16} color={theme.textPrimary} />
            )}
            <Text style={[styles.controlBtnText, { color: theme.textPrimary }]}>
              {isPrivate ? 'Oculto' : 'Visible'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.8}
            style={[
              styles.controlBtn,
              { backgroundColor: theme.surfaceMuted },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? (
              <Sun size={16} color={theme.accentGold} />
            ) : (
              <Moon size={16} color={theme.textPrimary} />
            )}
            <Text style={[styles.controlBtnText, { color: theme.textPrimary }]}>
              {isDark ? 'Claro' : 'Oscuro'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
    zIndex: 10,
  },
  brandContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  campanaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  campanaDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  campanaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  navSection: {
    paddingHorizontal: 12,
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  navItemContent: {
    flex: 1,
    gap: 1,
  },
  navItemLabel: {
    fontSize: 13,
  },
  navItemSub: {
    fontSize: 10,
  },
  quickLinksSection: {
    paddingHorizontal: 12,
    marginTop: 20,
    gap: 6,
  },
  smallQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  smallQuickText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerTogglePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
