import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gasGet, gasPost } from '../services/api';
import {
  CambiarEstadoChequeInput,
  CrearChequeDiferidoInput,
  LiquidarChequeInput,
} from '../types/api';
import { ChequeDiferido } from '../types/domain';

export function useCheques() {
  return useQuery({
    queryKey: ['cheques'],
    queryFn: () => gasGet<ChequeDiferido[]>('getCheques'),
  });
}

export function useCrearCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearChequeDiferidoInput) =>
      gasPost<ChequeDiferido>('crearChequeDiferido', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
    },
  });
}

export function useLiquidarCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LiquidarChequeInput) =>
      gasPost('liquidarChequeDiferido', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
    },
  });
}

export function useCambiarEstadoCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CambiarEstadoChequeInput) =>
      gasPost<ChequeDiferido>('cambiarEstadoCheque', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
    },
  });
}

