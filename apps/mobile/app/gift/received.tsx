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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getReceivedGifts, acceptGift, rejectGift } from '../../src/services/api';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';

export default function ReceivedGiftsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['gifts-received'],
    queryFn: getReceivedGifts,
  });

  const accept = useMutation({
    mutationFn: acceptGift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      Alert.alert('수락 완료', '메시지가 보관함에 추가되었습니다.');
    },
    onError: (err: any) => {
      Alert.alert('오류', err.response?.data?.error || '수락에 실패했습니다.');
    },
  });

  const reject = useMutation({
    mutationFn: rejectGift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
    },
    onError: (err: any) => {
      Alert.alert('오류', err.response?.data?.error || '거절에 실패했습니다.');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.loader} color={Colors.light.primary} />
      </SafeAreaView>
    );
  }

  const statusLabel = (status: string) => {
    if (status === 'accepted') return '수락됨';
    if (status === 'rejected') return '거절됨';
    return '대기 중';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyText}>받은 선물이 없습니다</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.senderInfo}>
                <Text style={styles.senderName}>{item.sender_name || '알 수 없음'}</Text>
                <Text style={styles.senderEmail}>{item.sender_email}</Text>
              </View>
              <Text style={[
                styles.status,
                item.status === 'accepted' && styles.statusAccepted,
                item.status === 'rejected' && styles.statusRejected,
              ]}>
                {statusLabel(item.status)}
              </Text>
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.messageText} numberOfLines={2}>{item.message_text}</Text>
            </View>

            {item.note && (
              <Text style={styles.note}>"{item.note}"</Text>
            )}

            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => accept.mutate(item.id)}
                  disabled={accept.isPending}
                >
                  <Text style={styles.acceptBtnText}>수락</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() =>
                    Alert.alert('선물 거절', '이 선물을 거절하시겠습니까?', [
                      { text: '취소', style: 'cancel' },
                      { text: '거절', style: 'destructive', onPress: () => reject.mutate(item.id) },
                    ])
                  }
                  disabled={reject.isPending}
                >
                  <Text style={styles.rejectBtnText}>거절</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.light.text,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  senderEmail: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  status: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.light.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.surfaceVariant,
    overflow: 'hidden',
  },
  statusAccepted: {
    color: Colors.light.success,
  },
  statusRejected: {
    color: Colors.light.error,
  },
  messageBox: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  category: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: Colors.light.surfaceVariant,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: Colors.light.textSecondary,
    fontWeight: '600',
    fontSize: FontSize.md,
  },
});
