import { useState, useMemo, useEffect } from 'react';
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
import { Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';
import { useTheme, type ThemeColors } from '../../src/hooks/useTheme';
import { getVoiceProfiles, deleteVoiceProfile } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { ErrorView } from '../../src/components/QueryStateView';
import type { VoiceProfile } from '../../src/types';
import { getApiErrorMessage } from '../../src/types';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { cacheVoices, getCachedVoices } from '../../src/services/offlineCache';

export default function VoicesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { t } = useTranslation();
  const toast = useToast();
  const { colors } = useTheme();
  const isConnected = useNetworkStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [cachedProfiles, setCachedProfiles] = useState<VoiceProfile[] | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    getCachedVoices().then(setCachedProfiles);
  }, []);

  const {
    data: profiles,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: isAuthenticated && isConnected,
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (profiles && profiles.length > 0) {
      cacheVoices(profiles);
      setCachedProfiles(profiles);
    }
  }, [profiles]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const displayProfiles = profiles ?? cachedProfiles;

  const filteredProfiles = useMemo(() => {
    if (!displayProfiles) return displayProfiles;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayProfiles;
    return displayProfiles.filter((p) => p.name.toLowerCase().includes(q));
  }, [displayProfiles, searchQuery]);

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
        return { label: t('voices.statusReady'), color: colors.success };
      case 'processing':
        return { label: t('voices.statusProcessing'), color: colors.warning };
      case 'failed':
        return { label: t('voices.statusFailed'), color: colors.error };
      default:
        return { label: status, color: colors.textTertiary };
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
          accessibilityRole="button"
          accessibilityLabel={`${item.name} ${badge.label}`}
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
            accessibilityRole="button"
            accessibilityLabel={`${t('common.delete')} ${item.name}`}
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
        contentContainerStyle={{ paddingBottom: 100 }}
      >
      <View style={styles.header}>
        <Text style={styles.title}>{t('voices.title')}</Text>
        <Text style={styles.subtitle}>{t('voices.subtitle')}</Text>
      </View>

      <View style={styles.addSection}>
        <TouchableOpacity
          style={styles.addCard}
          onPress={() => router.push('/voice/record')}
          accessibilityRole="button"
          accessibilityLabel={t('voices.record')}
        >
          <Text style={styles.addEmoji}>🎙️</Text>
          <View>
            <Text style={styles.addTitle}>{t('voices.record')}</Text>
            <Text style={styles.addDesc}>{t('voices.recordDesc')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addCard}
          onPress={() => router.push('/voice/upload')}
          accessibilityRole="button"
          accessibilityLabel={t('voices.upload')}
        >
          <Text style={styles.addEmoji}>📁</Text>
          <View>
            <Text style={styles.addTitle}>{t('voices.upload')}</Text>
            <Text style={styles.addDesc}>{t('voices.uploadDesc')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addCard, styles.addCardHighlight]}
          onPress={() => router.push('/voice/diarize')}
          accessibilityRole="button"
          accessibilityLabel={t('voices.callRecord')}
        >
          <Text style={styles.addEmoji}>📞</Text>
          <View>
            <Text style={[styles.addTitle, { color: '#FFF' }]}>{t('voices.callRecord')}</Text>
            <Text style={[styles.addDesc, { color: 'rgba(255,255,255,0.8)' }]}>
              {t('voices.callRecordDesc')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addCard}
          onPress={() => router.push('/voice/picker')}
          accessibilityRole="button"
          accessibilityLabel={t('voices.speakerDetect', '화자 감지')}
        >
          <Text style={styles.addEmoji}>🧩</Text>
          <View>
            <Text style={styles.addTitle}>화자 감지 (mock)</Text>
            <Text style={styles.addDesc}>업로드 후 감지된 화자를 직접 선택·편집합니다.</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          {t('voices.registered')} ({displayProfiles?.length ?? 0})
        </Text>
        {displayProfiles && displayProfiles.length > 0 && (
          <TextInput
            style={styles.searchInput}
            placeholder={t('voices.searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        )}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
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
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.push('/voice/record')}
              accessibilityRole="button"
              accessibilityLabel={t('voices.record')}
            >
              <Text style={styles.emptyCtaText}>{t('voices.record')}</Text>
            </TouchableOpacity>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    title: {
      fontSize: FontSize.hero,
      fontFamily: FontFamily.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    addSection: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    addCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
    },
    addCardHighlight: {
      backgroundColor: colors.primary,
    },
    addEmoji: {
      fontSize: 28,
    },
    addTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.semibold,
      color: colors.text,
    },
    addDesc: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    listSection: {
      padding: Spacing.lg,
      flex: 1,
    },
    listTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: FontSize.md,
      color: colors.text,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: FontSize.xl,
      fontFamily: FontFamily.bold,
      color: colors.primaryDark,
    },
    profileInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    profileName: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.semibold,
      color: colors.text,
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
      fontFamily: FontFamily.semibold,
    },
    profileDate: {
      fontSize: FontSize.xs,
      color: colors.textTertiary,
      marginTop: 2,
    },
    deleteButton: {
      padding: Spacing.sm,
    },
    deleteText: {
      fontSize: FontSize.sm,
      color: colors.error,
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
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    emptyCta: {
      marginTop: Spacing.lg,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm + 4,
      borderRadius: BorderRadius.full,
      minHeight: 44,
      justifyContent: 'center',
    },
    emptyCtaText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semibold,
      color: colors.surface,
    },
    swipeDeleteContainer: {
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.sm,
    },
    swipeDeleteText: {
      color: '#FFF',
      fontFamily: FontFamily.bold,
      fontSize: FontSize.md,
    },
  });
}
