import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gasGet, gasPost } from '../services/api';
import {
  AjustarSaldoInput,
  CrearCuentaInput,
  PagarTarjetaInput,
  RegistrarTransferenciaInput,
} from '../types/api';
import { CampanaLoteAgro, CuentaAgro } from '../types/domain';

export function useCuentas() {
  return useQuery({
    queryKey: ['cuentas'],
    queryFn: () => gasGet<CuentaAgro[]>('getCuentas'),
  });
}

export function useCampanas() {
  return useQuery({
    queryKey: ['campanas'],
    queryFn: () => gasGet<CampanaLoteAgro[]>('getCampanas'),
  });
}

export function useCrearCuenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearCuentaInput) =>
      gasPost<CuentaAgro>('crearCuenta', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
    },
  });
}

export function useTransferirBimoneda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegistrarTransferenciaInput) =>
      gasPost('registrarTransferencia', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
    },
  });
}

export function usePagarTarjetaAgro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PagarTarjetaInput) =>
      gasPost('pagarTarjetaAgro', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
    },
  });
}

export function useAjustarSaldo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AjustarSaldoInput) =>
      gasPost('ajustarSaldoCuenta', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] });
    },
  });
}

export function useResetCleanData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gasPost('resetCleanSheet', {}),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useRestoreDemoLocal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gasPost('restoreDemoLocal', {}),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
