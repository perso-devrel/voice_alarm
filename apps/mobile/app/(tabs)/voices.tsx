import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Animated as RNAnimated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getVoiceProfiles, deleteVoiceProfile } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { ErrorView } from '../../src/components/QueryStateView';
import type { VoiceProfile } from '../../src/types';
import { getApiErrorMessage } from '../../src/types';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';

export default function VoicesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { t } = useTranslation();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: profiles,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: isAuthenticated,
  });

  const filteredProfiles = useMemo(() => {
    if (!profiles) return profiles;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => p.name.toLowerCase().includes(q));
  }, [profiles, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: deleteVoiceProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('voices.deleteError')));
    },
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert(t('voices.deleteTitle'), t('voices.deleteConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return { label: t('voices.statusReady'), color: Colors.light.success };
      case 'processing':
        return { label: t('voices.statusProcessing'), color: Colors.light.warning };
      case 'failed':
        return { label: t('voices.statusFailed'), color: Colors.light.error };
      default:
        return { label: status, color: Colors.light.textTertiary };
    }
  };

  const renderDeleteAction = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.swipeDeleteContainer}>
        <RNAnimated.Text style={[styles.swipeDeleteText, { transform: [{ scale }] }]}>
          {t('common.delete')}
        </RNAnimated.Text>
      </View>
    );
  };

  const renderProfile = ({ item }: { item: VoiceProfile }) => {
    const badge = getStatusBadge(item.status);
    return (
      <Swipeable
        renderRightActions={renderDeleteAction}
        onSwipeableOpen={() => handleDelete(item.id, item.name)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: '/voice/[id]', params: { id: item.id } })}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.color + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
              <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
            </View>
            <Text style={styles.profileDate}>
              {new Date(item.created_at).toLocaleDateString('ko-KR')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Text style={styles.deleteText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <Text style={styles.title}>{t('voices.title')}</Text>
        <Text style={styles.subtitle}>{t('voices.subtitle')}</Text>
      </View>

      <View style={styles.addSection}>
        <TouchableOpacity style={styles.addCard} onPress={() => router.push('/voice/record')}>
          <Text style={styles.addEmoji}>🎙️</Text>
          <View>
            <Text style={styles.addTitle}>{t('voices.record')}</Text>
            <Text style={styles.addDesc}>{t('voices.recordDesc')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addCard} onPress={() => router.push('/voice/upload')}>
          <Text style={styles.addEmoji}>📁</Text>
          <View>
            <Text style={styles.addTitle}>{t('voices.upload')}</Text>
            <Text style={styles.addDesc}>{t('voices.uploadDesc')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addCard, styles.addCardHighlight]}
          onPress={() => router.push('/voice/diarize')}
        >
          <Text style={styles.addEmoji}>📞</Text>
          <View>
            <Text style={[styles.addTitle, { color: '#FFF' }]}>{t('voices.callRecord')}</Text>
            <Text style={[styles.addDesc, { color: 'rgba(255,255,255,0.8)' }]}>
              {t('voices.callRecordDesc')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addCard} onPress={() => router.push('/voice/picker')}>
          <Text style={styles.addEmoji}>🧩</Text>
          <View>
            <Text style={styles.addTitle}>화자 감지 (mock)</Text>
            <Text style={styles.addDesc}>업로드 후 감지된 화자를 직접 선택·편집합니다.</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          {t('voices.registered')} ({profiles?.length ?? 0})
        </Text>
        {profiles && profiles.length > 0 && (
          <TextInput
            style={styles.searchInput}
            placeholder={t('voices.searchPlaceholder')}
            placeholderTextColor={Colors.light.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        )}
        {isLoading ? (
          <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />
        ) : isError ? (
          <ErrorView onRetry={refetch} />
        ) : filteredProfiles?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎵</Text>
            <Text style={styles.emptyText}>
              {t('voices.emptyTitle')}
              {'\n'}
              {t('voices.emptyDesc')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProfiles}
            keyExtractor={(item) => item.id}
            renderItem={renderProfile}
            scrollEnabled={false}
          />
        )}
      </View>
      </ScrollView>
      <Toast message={toast.message} opacity={toast.opacity} />
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
  addSection: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  addCardHighlight: {
    backgroundColor: Colors.light.primary,
  },
  addEmoji: {
    fontSize: 28,
  },
  addTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.light.text,
  },
  addDesc: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  listSection: {
    padding: Spacing.lg,
    flex: 1,
  },
  listTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.light.text,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.light.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  profileDate: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  deleteText: {
    fontSize: FontSize.sm,
    color: Colors.light.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  swipeDeleteContainer: {
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  swipeDeleteText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
