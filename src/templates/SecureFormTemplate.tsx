import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { HamsterLoader, SecureButton } from '../components/ui';

export interface ValidationRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface SecureFormTemplateProps {
  title: string;
  subtitle: string;
  isSubmitting?: boolean;
  warningMessage?: string;
  validationSummary: ValidationRow[];
  submitLabel: string;
  canSubmit: boolean;
  onSubmit: () => void;
  secondaryLabel?: string;
  onSecondarySubmit?: () => void;
  children: React.ReactNode;
}

export const SecureFormTemplate: React.FC<SecureFormTemplateProps> = ({
  title,
  subtitle,
  isSubmitting = false,
  warningMessage,
  validationSummary,
  submitLabel,
  canSubmit,
  onSubmit,
  secondaryLabel,
  onSecondarySubmit,
  children,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.surfaceMuted }]}
        >
          <Text style={[styles.closeText, { color: theme.textPrimary }]}>
            Cerrar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {children}

        {warningMessage ? (
          <View
            style={[
              styles.warningCard,
              {
                backgroundColor: theme.warningSoft,
                borderColor: theme.warning,
              },
            ]}
          >
            <AlertTriangle size={18} color={theme.warning} />
            <Text style={[styles.warningText, { color: theme.textPrimary }]}>
              {warningMessage}
            </Text>
          </View>
        ) : null}

        {/* Tarjeta de Resumen de Validación Previa */}
        <View
          style={[
            styles.validationCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderStrong,
            },
          ]}
        >
          <View style={styles.validationHeader}>
            <ShieldCheck size={16} color={theme.primary} />
            <Text
              style={[styles.validationTitle, { color: theme.textPrimary }]}
            >
              RESUMEN DE VALIDACIÓN PREVIA
            </Text>
          </View>

          {validationSummary.map((row, idx) => (
            <View key={idx} style={styles.validationRow}>
              <Text
                style={[styles.validationLabel, { color: theme.textSecondary }]}
              >
                {row.label}
              </Text>
              <Text
                style={[
                  styles.validationVal,
                  {
                    color: row.highlight ? theme.primary : theme.textPrimary,
                    fontWeight: row.highlight ? '800' : '600',
                  },
                ]}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <SecureButton
          label={submitLabel}
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
          icon="CheckCircle2"
        />
        {secondaryLabel && onSecondarySubmit ? (
          <TouchableOpacity
            onPress={onSecondarySubmit}
            disabled={!canSubmit || isSubmitting}
            style={[
              styles.secondaryBtn,
              {
                borderColor: theme.primary,
                opacity: !canSubmit || isSubmitting ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryText, { color: theme.primary }]}>
              {secondaryLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {isSubmitting ? <HamsterLoader /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  secondaryBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  validationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    gap: 9,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  validationTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  validationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validationLabel: {
    fontSize: 12,
  },
  validationVal: {
    fontSize: 13,
  },
});

