import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Money, SecureButton } from '../components/ui';
import { CurrencyCode } from '../types/domain';

interface ReceiptDetailItem {
  label: string;
  value: string;
}

interface SuccessReceiptTemplateProps {
  title: string;
  operationId: string;
  date: string; // DD-MM-AAAA
  amount: number;
  currency: CurrencyCode;
  equivalentText: string;
  details: ReceiptDetailItem[];
  onDone: () => void;
}

export const SuccessReceiptTemplate: React.FC<SuccessReceiptTemplateProps> = ({
  title,
  operationId,
  date,
  amount,
  currency,
  equivalentText,
  details,
  onDone,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.ticketCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderStrong,
          },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.successSoft },
          ]}
        >
          <CheckCircle2 size={34} color={theme.success} />
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.opId, { color: theme.textSecondary }]}>
          Comprobante #{operationId} · Fecha {date}
        </Text>

        <View
          style={[
            styles.amountBanner,
            { backgroundColor: theme.surfaceMuted },
          ]}
        >
          <Money amount={amount} currency={currency} size="xl" />
          <Text style={[styles.equivText, { color: theme.textSecondary }]}>
            {equivalentText}
          </Text>
        </View>

        <View style={styles.detailsList}>
          {details.map((d, idx) => (
            <View
              key={idx}
              style={[
                styles.detailRow,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                {d.label}
              </Text>
              <Text style={[styles.detailVal, { color: theme.textPrimary }]}>
                {d.value}
              </Text>
            </View>
          ))}
        </View>

        <SecureButton
          label="Volver al Panel Principal"
          onPress={onDone}
          icon="ShieldCheck"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ticketCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  opId: {
    fontSize: 12,
    textAlign: 'center',
  },
  amountBanner: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  equivText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsList: {
    width: '100%',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
  },
});

