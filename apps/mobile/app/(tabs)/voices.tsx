import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
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

export default function VoicesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { t } = useTranslation();

  const {
    data: profiles,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoiceProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
    },
    onError: (err: unknown) => {
      Alert.alert(t('common.error'), getApiErrorMessage(err, t('voices.deleteError')));
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

  const renderProfile = ({ item }: { item: VoiceProfile }) => {
    const badge = getStatusBadge(item.status);
    return (
      <View style={styles.profileCard}>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
      </View>

      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          {t('voices.registered')} ({profiles?.length ?? 0})
        </Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />
        ) : isError ? (
          <ErrorView onRetry={refetch} />
        ) : profiles?.length === 0 ? (
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
            data={profiles}
            keyExtractor={(item) => item.id}
            renderItem={renderProfile}
            scrollEnabled={false}
          />
        )}
      </View>
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
});
