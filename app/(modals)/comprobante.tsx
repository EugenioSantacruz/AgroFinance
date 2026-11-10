import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SuccessReceiptTemplate } from '../../src/templates/SuccessReceiptTemplate';
import { CurrencyCode } from '../../src/types/domain';
import { getTodayDDMMYYYY } from '../../src/utils/dates';

export default function ComprobanteModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    date?: string;
    amount?: string;
    currency?: CurrencyCode;
    cuenta?: string;
    campana?: string;
    concepto?: string;
  }>();

  const amountNum = parseFloat(params.amount || '0') || 0;
  const currency: CurrencyCode = params.currency === 'USD' ? 'USD' : 'PYG';

  return (
    <SuccessReceiptTemplate
      title={params.title || 'Operación Asentada Exitosamente'}
      operationId={params.id || 'MOV-OK'}
      date={params.date || getTodayDDMMYYYY()}
      amount={amountNum}
      currency={currency}
      equivalentText="Sincronizado en Libro Mayor Google Sheets"
      details={[
        {
          label: 'Cuenta / Medio',
          value: params.cuenta || '-',
        },
        {
          label: 'Unidad Productiva / Campaña',
          value: params.campana || '-',
        },
        {
          label: 'Concepto',
          value: params.concepto || '-',
        },
      ]}
      onDone={() => router.replace('/(tabs)')}
    />
  );
}

