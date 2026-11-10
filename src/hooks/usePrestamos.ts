import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gasGet, gasPost } from '../services/api';
import { CrearCompraCuotasInput, PagarCuotaInput } from '../types/api';
import { PrestamoAgro } from '../types/domain';

export function usePrestamos() {
  return useQuery({
    queryKey: ['prestamos'],
    queryFn: () => gasGet<PrestamoAgro[]>('getPrestamos'),
  });
}

export function useCrearCompraCuotas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearCompraCuotasInput) =>
      gasPost<PrestamoAgro>('crearCompraCuotas', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
    },
  });
}

export function usePagarCuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PagarCuotaInput) => gasPost('pagarCuota', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
    },
  });
}
