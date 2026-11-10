import { useQuery } from '@tanstack/react-query';
import { gasGet } from '../services/api';
import { AmbitoFiltro, MetricasDashboardAgro } from '../types/domain';

export function useMetricas(
  campanaId = 'ALL',
  ambito: AmbitoFiltro = 'TODOS'
) {
  return useQuery({
    queryKey: ['metricas', campanaId, ambito],
    queryFn: () =>
      gasGet<MetricasDashboardAgro>('getMetricasDashboard', {
        campanaId,
        ambito,
      }),
  });
}
