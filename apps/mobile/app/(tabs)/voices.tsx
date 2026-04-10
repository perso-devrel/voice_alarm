import { useState } from 'react';
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
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getVoiceProfiles, deleteVoiceProfile } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { ErrorView } from '../../src/components/QueryStateView';

export default function VoicesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const { data: profiles, isLoading, isError, refetch } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoiceProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
    },
    onError: (err: any) => {
      Alert.alert('오류', err.response?.data?.error ?? '음성 프로필 삭제에 실패했어요.');
    },
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '음성 프로필 삭제',
      `"${name}" 프로필을 삭제하시겠어요?\n이 음성으로 만든 메시지는 유지됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return { label: '사용 가능', color: Colors.light.success };
      case 'processing':
        return { label: '생성 중...', color: Colors.light.warning };
      case 'failed':
        return { label: '실패', color: Colors.light.error };
      default:
        return { label: status, color: Colors.light.textTertiary };
    }
  };

  const renderProfile = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);
    return (
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0)}
          </Text>
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
          <Text style={styles.deleteText}>삭제</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>음성 프로필</Text>
        <Text style={styles.subtitle}>소중한 사람의 목소리를 등록하세요</Text>
      </View>

      {/* 등록 방법 선택 */}
      <View style={styles.addSection}>
        <TouchableOpacity
          style={styles.addCard}
          onPress={() => router.push('/voice/record')}
        >
          <Text style={styles.addEmoji}>🎙️</Text>
          <View>
            <Text style={styles.addTitle}>직접 녹음</Text>
            <Text style={styles.addDesc}>마이크로 음성을 녹음해요</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addCard}
          onPress={() => router.push('/voice/upload')}
        >
          <Text style={styles.addEmoji}>📁</Text>
          <View>
            <Text style={styles.addTitle}>파일 업로드</Text>
            <Text style={styles.addDesc}>오디오 파일을 선택해요</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addCard, styles.addCardHighlight]}
          onPress={() => router.push('/voice/diarize')}
        >
          <Text style={styles.addEmoji}>📞</Text>
          <View>
            <Text style={[styles.addTitle, { color: '#FFF' }]}>통화 녹음</Text>
            <Text style={[styles.addDesc, { color: 'rgba(255,255,255,0.8)' }]}>
              통화 녹음에서 화자를 분리해요
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 프로필 목록 */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          등록된 음성 ({profiles?.length ?? 0})
        </Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />
        ) : isError ? (
          <ErrorView onRetry={refetch} />
        ) : profiles?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎵</Text>
            <Text style={styles.emptyText}>
              아직 등록된 음성이 없어요{'\n'}위의 버튼으로 음성을 등록해보세요!
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
