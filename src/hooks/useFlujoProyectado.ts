import { useQuery } from '@tanstack/react-query';
import { gasGet } from '../services/api';
import { AmbitoFiltro, FlujoCajaProyectado } from '../types/domain';

export function useFlujoProyectado(ambito: AmbitoFiltro = 'TODOS') {
  return useQuery({
    queryKey: ['flujoProyectado', ambito],
    queryFn: () =>
      gasGet<FlujoCajaProyectado>('getFlujoCajaProyectado', { ambito }),
  });
}

