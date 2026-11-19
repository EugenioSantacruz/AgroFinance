import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  onlineManager,
  useIsFetching,
  useIsMutating,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { Check, CloudOff, Clock, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

function formatAgo(ts: number, now: number): string {
  const min = Math.floor((now - ts) / 60000);
  if (min < 1) return 'Sincronizado ahora';
  if (min < 60) return `Sincronizado hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Sincronizado hace ${h} h`;
  return `Sincronizado hace ${Math.floor(h / 24)} d`;
}

/**
 * Indicador de estado de sincronización:
 * Sin conexión · Pendiente de enviar · Sincronizando · Sincronizado hace X.
 */
export const SyncStatus: React.FC<{ isSyncing?: boolean }> = ({
  isSyncing = false,
}) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const isOnline = useSyncExternalStore(
    onlineManager.subscribe.bind(onlineManager),
    () => onlineManager.isOnline(),
    () => true
  );
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const pausedCount = useMutationState({
    filters: { status: 'pending' },
    select: (m) => m.state.isPaused,
  }).filter(Boolean).length;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const lastSync = queryClient
    .getQueryCache()
    .getAll()
    .reduce((max, q) => Math.max(max, q.state.dataUpdatedAt), 0);

  let text: string;
  let kind: 'warning' | 'busy' | 'ok';
  let Icon = Check;

  if (!isOnline) {
    kind = 'warning';
    Icon = CloudOff;
    text =
      pausedCount > 0
        ? `Sin conexión · ${pausedCount} pendiente${pausedCount > 1 ? 's' : ''}`
        : 'Sin conexión';
  } else if (pausedCount > 0) {
    kind = 'warning';
    Icon = Clock;
    text = 'Pendiente de enviar';
  } else if (isSyncing || fetching > 0 || mutating > 0) {
    kind = 'busy';
    Icon = RefreshCw;
    text = 'Sincronizando...';
  } else if (lastSync > 0) {
    kind = 'ok';
    text = formatAgo(lastSync, now);
  } else {
    return null;
  }

  const bg =
    kind === 'warning'
      ? theme.accentGoldSoft
      : kind === 'busy'
      ? theme.primarySoft
      : theme.surfaceMuted;
  const fg =
    kind === 'warning'
      ? theme.accentGold
      : kind === 'busy'
      ? theme.primary
      : theme.textSecondary;

  return (
    <View
      style={[styles.pill, { backgroundColor: bg }]}
      accessible
      accessibilityLabel={`Estado de sincronización: ${text}`}
      accessibilityLiveRegion="polite"
    >
      <Icon size={12} color={fg} />
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

