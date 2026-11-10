import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gasGet, gasPost } from '../services/api';
import { ActualizarCotizacionInput } from '../types/api';
import { CotizacionBimoneda } from '../types/domain';

export function useCotizacion() {
  return useQuery({
    queryKey: ['cotizacion'],
    queryFn: () => gasGet<CotizacionBimoneda>('getCotizacion'),
  });
}

export function useActualizarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActualizarCotizacionInput) =>
      gasPost<CotizacionBimoneda>('actualizarCotizacion', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizacion'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
    },
  });
}
