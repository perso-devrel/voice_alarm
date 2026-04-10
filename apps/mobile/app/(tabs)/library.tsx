import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getLibrary, toggleFavorite } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { cacheLibrary, getCachedLibrary } from '../../src/services/offlineCache';
import { ErrorView } from '../../src/components/QueryStateView';
import { MiniWaveformPlayer } from '../../src/components/MiniWaveformPlayer';
import { Audio } from 'expo-av';
import type { LibraryItem } from '../../src/types';

type FilterType = 'all' | 'favorite';

export default function LibraryScreen() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { setPlaying, currentPlayingId } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const { t } = useTranslation();
  const isConnected = useNetworkStatus();
  const [cachedItems, setCachedItems] = useState<LibraryItem[] | null>(null);

  useEffect(() => {
    getCachedLibrary().then(setCachedItems);
  }, []);

  const {
    data: items,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['library', filter],
    queryFn: () => getLibrary(filter === 'favorite' ? 'favorite' : undefined),
    enabled: isAuthenticated && isConnected,
  });

  useEffect(() => {
    if (items && items.length > 0 && filter === 'all') {
      cacheLibrary(items);
      setCachedItems(items);
    }
  }, [items, filter]);

  const displayItems = items ?? (filter === 'all' ? cachedItems : null);
  const showingCached = !items && !!cachedItems && !isConnected && filter === 'all';

  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
    onError: () => {
      Alert.alert(t('common.error'), t('library.favoriteError'));
    },
  });

  const handleMiniPlay = (messageId: string, sound: Audio.Sound) => {
    if (currentSound) {
      currentSound.unloadAsync();
    }
    setCurrentSound(sound);
    setPlaying(messageId);
  };

  const handleMiniStop = () => {
    setPlaying(null);
    setCurrentSound(null);
  };

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      morning: '🌅',
      lunch: '🍽️',
      afternoon: '☕',
      evening: '🌙',
      night: '😴',
      cheer: '💪',
      love: '❤️',
      health: '🏥',
      custom: '✏️',
    };
    return map[category] || '💌';
  };

  const renderItem = ({ item }: { item: LibraryItem }) => {
    const isActive = currentPlayingId === item.message_id;
    return (
      <View style={styles.messageCard}>
        <View style={styles.messageLeft}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarLetter}>{item.voice_name?.charAt(0) || '?'}</Text>
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.voiceName}>{item.voice_name}</Text>
              <Text style={styles.categoryBadge}>{getCategoryEmoji(item.category)}</Text>
            </View>
            <Text style={styles.messageText} numberOfLines={2}>
              "{item.text}"
            </Text>
            <View style={styles.miniPlayerRow}>
              <MiniWaveformPlayer
                messageId={item.message_id}
                isActive={isActive}
                onPlay={handleMiniPlay}
                onStop={handleMiniStop}
              />
            </View>
            <Text style={styles.messageDate}>
              {new Date(item.received_at).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.messageActions}>
          <TouchableOpacity
            onPress={() => favoriteMutation.mutate(item.id)}
            hitSlop={8}
          >
            <Text style={styles.favoriteIcon}>{item.is_favorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('library.title')}</Text>
        <Text style={styles.subtitle}>{t('library.subtitle')}</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            {t('library.all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'favorite' && styles.filterChipActive]}
          onPress={() => setFilter('favorite')}
        >
          <Text style={[styles.filterText, filter === 'favorite' && styles.filterTextActive]}>
            ❤️ {t('library.favorites')}
          </Text>
        </TouchableOpacity>
      </View>

      {showingCached && (
        <View style={styles.cachedBanner}>
          <Text style={styles.cachedText}>{t('offline.cachedData')}</Text>
        </View>
      )}

      {isLoading && !cachedItems ? (
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 80 }} />
      ) : isError && !cachedItems ? (
        <ErrorView onRetry={refetch} />
      ) : displayItems?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>
            {filter === 'favorite' ? t('library.emptyFavorites') : t('library.emptyAll')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  cachedBanner: {
    backgroundColor: Colors.light.surfaceVariant,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  cachedText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  list: {
    padding: Spacing.lg,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  messageLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarLetter: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  voiceName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryBadge: {
    fontSize: 14,
  },
  messageText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  miniPlayerRow: {
    marginTop: Spacing.xs,
  },
  messageDate: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginTop: 4,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
