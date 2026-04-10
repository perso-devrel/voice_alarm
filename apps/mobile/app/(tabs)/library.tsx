import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getLibrary, toggleFavorite } from '../../src/services/api';
import { playAudio, getLocalAudioPath, isAudioCached } from '../../src/services/audio';
import { useAppStore } from '../../src/stores/useAppStore';
import { Audio } from 'expo-av';

type FilterType = 'all' | 'favorite';

export default function LibraryScreen() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { setPlaying, currentPlayingId } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['library', filter],
    queryFn: () => getLibrary(filter === 'favorite' ? 'favorite' : undefined),
    enabled: isAuthenticated,
  });

  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const handlePlay = async (messageId: string) => {
    if (currentSound) {
      await currentSound.unloadAsync();
      setCurrentSound(null);
    }

    if (currentPlayingId === messageId) {
      setPlaying(null);
      return;
    }

    const cached = await isAudioCached(messageId);
    if (cached) {
      const localPath = getLocalAudioPath(messageId);
      const sound = await playAudio(localPath);
      setCurrentSound(sound);
      setPlaying(messageId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setPlaying(null);
          setCurrentSound(null);
        }
      });
    }
  };

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      morning: '🌅', lunch: '🍽️', afternoon: '☕',
      evening: '🌙', night: '😴', cheer: '💪',
      love: '❤️', health: '🏥', custom: '✏️',
    };
    return map[category] || '💌';
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.messageCard}
      onPress={() => handlePlay(item.message_id)}
      activeOpacity={0.8}
    >
      <View style={styles.messageLeft}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarLetter}>
            {item.voice_name?.charAt(0) || '?'}
          </Text>
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.voiceName}>{item.voice_name}</Text>
            <Text style={styles.categoryBadge}>
              {getCategoryEmoji(item.category)}
            </Text>
          </View>
          <Text style={styles.messageText} numberOfLines={2}>
            "{item.text}"
          </Text>
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
        {currentPlayingId === item.message_id && (
          <Text style={styles.playingIndicator}>♫</Text>
        )}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            favoriteMutation.mutate(item.id);
          }}
          hitSlop={8}
        >
          <Text style={styles.favoriteIcon}>
            {item.is_favorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>보관함</Text>
        <Text style={styles.subtitle}>받았던 모든 음성 메시지</Text>
      </View>

      {/* 필터 */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            전체
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'favorite' && styles.filterChipActive]}
          onPress={() => setFilter('favorite')}
        >
          <Text style={[styles.filterText, filter === 'favorite' && styles.filterTextActive]}>
            ❤️ 즐겨찾기
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 80 }} />
      ) : items?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>
            {filter === 'favorite'
              ? '즐겨찾기한 메시지가 없어요'
              : '아직 받은 메시지가 없어요'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  playingIndicator: {
    fontSize: 18,
    color: Colors.light.primary,
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
