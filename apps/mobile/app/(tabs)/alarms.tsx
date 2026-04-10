import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getAlarms, updateAlarm, deleteAlarm } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { DAYS_OF_WEEK } from '../../src/constants/presets';

export default function AlarmsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const { data: alarms, isLoading } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
    enabled: isAuthenticated,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateAlarm(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alarms'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlarm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alarms'] }),
  });

  const handleDelete = (id: string) => {
    Alert.alert('알람 삭제', '이 알람을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const formatRepeatDays = (days: number[]) => {
    if (days.length === 0) return '한 번만';
    if (days.length === 7) return '매일';
    if (JSON.stringify(days.sort()) === JSON.stringify([1, 2, 3, 4, 5])) return '평일';
    if (JSON.stringify(days.sort()) === JSON.stringify([0, 6])) return '주말';
    return days.map((d) => DAYS_OF_WEEK[d]).join(', ');
  };

  const renderAlarm = ({ item }: { item: any }) => {
    const repeatDays = JSON.parse(item.repeat_days || '[]');
    return (
      <TouchableOpacity
        style={[styles.alarmCard, !item.is_active && styles.alarmCardInactive]}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.alarmLeft}>
          <Text style={[styles.alarmTime, !item.is_active && styles.textInactive]}>
            {item.time}
          </Text>
          <Text style={[styles.alarmRepeat, !item.is_active && styles.textInactive]}>
            {formatRepeatDays(repeatDays)}
          </Text>
          <View style={styles.alarmMeta}>
            <Text style={styles.alarmVoice}>🗣️ {item.voice_name}</Text>
            <Text style={styles.alarmMessage} numberOfLines={1}>
              "{item.message_text}"
            </Text>
          </View>
        </View>
        <Switch
          value={!!item.is_active}
          onValueChange={(value) =>
            toggleMutation.mutate({ id: item.id, is_active: value })
          }
          trackColor={{
            false: Colors.light.border,
            true: Colors.light.primaryLight,
          }}
          thumbColor={item.is_active ? Colors.light.primary : '#f4f3f4'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>알람</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/alarm/create')}
        >
          <Text style={styles.addButtonText}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 80 }} />
      ) : alarms?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⏰</Text>
          <Text style={styles.emptyTitle}>알람이 없어요</Text>
          <Text style={styles.emptyDesc}>
            소중한 사람의 목소리로{'\n'}알람을 설정해보세요
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/alarm/create')}
          >
            <Text style={styles.emptyButtonText}>첫 알람 만들기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={renderAlarm}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  list: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  alarmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  alarmCardInactive: {
    opacity: 0.6,
  },
  alarmLeft: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 36,
    fontWeight: '300',
    color: Colors.light.text,
  },
  textInactive: {
    color: Colors.light.textTertiary,
  },
  alarmRepeat: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  alarmMeta: {
    marginTop: Spacing.sm,
  },
  alarmVoice: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  alarmMessage: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
