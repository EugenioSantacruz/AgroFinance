import { useQuery } from '@tanstack/react-query';
import { gasGet } from '../services/api';
import { PresupuestoRubroAgro } from '../types/domain';

export function usePresupuestos(campanaId = 'ALL') {
  return useQuery({
    queryKey: ['presupuestos', campanaId],
    queryFn: () =>
      gasGet<PresupuestoRubroAgro[]>('getPresupuestos', { campanaId }),
  });
}

