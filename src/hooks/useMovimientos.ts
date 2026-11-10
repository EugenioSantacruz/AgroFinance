import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gasGet, gasPost } from '../services/api';
import { AnularMovimientoInput, RegistrarMovimientoInput } from '../types/api';
import { MovimientoAgro } from '../types/domain';

export function useMovimientos() {
  return useQuery({
    queryKey: ['movimientos'],
    queryFn: () => gasGet<MovimientoAgro[]>('getMovimientos'),
  });
}

export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegistrarMovimientoInput) =>
      gasPost<MovimientoAgro>('registrarMovimiento', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
    },
  });
}

export function useAnularMovimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnularMovimientoInput) =>
      gasPost('anularMovimiento', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
    },
  });
}
