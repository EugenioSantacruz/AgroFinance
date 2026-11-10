import { useQuery } from '@tanstack/react-query';
import { gasGet } from '../services/api';
import { CategoriaConfigAgro } from '../types/domain';

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => gasGet<CategoriaConfigAgro[]>('getCategorias'),
  });
}

