import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { DAYS_OF_WEEK } from '../../src/constants/presets';
import { getMessages, createAlarm, getFriendList } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import type { Friend, Message } from '../../src/types';
import { getApiErrorMessage } from '../../src/types';

export default function CreateAlarmScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, userId } = useAppStore();

  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [snooze, setSnooze] = useState(5);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string | null>(null);

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
    enabled: isAuthenticated,
  });

  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriendList,
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: createAlarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      Alert.alert('알람 설정 완료!', '매일 소중한 목소리로 깨워드릴게요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      Alert.alert('오류', getApiErrorMessage(err, '알람 생성에 실패했습니다.'));
    },
  });

  const toggleDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    if (!selectedMessageId) {
      Alert.alert('메시지 선택', '알람에 사용할 음성 메시지를 선택해주세요.');
      return;
    }

    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    createMutation.mutate({
      message_id: selectedMessageId,
      time,
      repeat_days: repeatDays,
      snooze_minutes: snooze,
      ...(targetUserId ? { target_user_id: targetUserId } : {}),
    });
  };

  const quickSetDays = (type: 'daily' | 'weekday' | 'weekend') => {
    if (type === 'daily') setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
    else if (type === 'weekday') setRepeatDays([1, 2, 3, 4, 5]);
    else setRepeatDays([0, 6]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 누구에게? */}
      {friends && friends.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>누구에게?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetRow}>
            <TouchableOpacity
              style={[styles.targetChip, !targetUserId && styles.targetChipActive]}
              onPress={() => { setTargetUserId(null); setTargetName(null); }}
            >
              <Text style={[styles.targetText, !targetUserId && styles.targetTextActive]}>나</Text>
            </TouchableOpacity>
            {friends.map((f: Friend) => {
              const friendId = f.user_a === userId ? f.user_b : f.user_a;
              const isSelected = targetUserId === friendId;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.targetChip, isSelected && styles.targetChipActive]}
                  onPress={() => {
                    setTargetUserId(isSelected ? null : friendId);
                    setTargetName(isSelected ? null : (f.friend_name || f.friend_email || null));
                  }}
                >
                  <Text style={[styles.targetText, isSelected && styles.targetTextActive]}>
                    {f.friend_name || f.friend_email?.split('@')[0] || '?'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {targetName && (
            <Text style={styles.targetHint}>{targetName}님에게 알람을 설정합니다</Text>
          )}
        </>
      )}

      {/* 시간 선택 */}
      <Text style={styles.sectionTitle}>시간</Text>
      <View style={styles.timePickerContainer}>
        <View style={styles.timePicker}>
          {/* 시 */}
          <View style={styles.timeColumn}>
            <TouchableOpacity
              style={styles.timeArrow}
              onPress={() => setHour((h) => (h + 1) % 24)}
            >
              <Text style={styles.arrowText}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeValue}>{hour.toString().padStart(2, '0')}</Text>
            <TouchableOpacity
              style={styles.timeArrow}
              onPress={() => setHour((h) => (h - 1 + 24) % 24)}
            >
              <Text style={styles.arrowText}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.timeSeparator}>:</Text>

          {/* 분 */}
          <View style={styles.timeColumn}>
            <TouchableOpacity
              style={styles.timeArrow}
              onPress={() => setMinute((m) => (m + 5) % 60)}
            >
              <Text style={styles.arrowText}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeValue}>{minute.toString().padStart(2, '0')}</Text>
            <TouchableOpacity
              style={styles.timeArrow}
              onPress={() => setMinute((m) => (m - 5 + 60) % 60)}
            >
              <Text style={styles.arrowText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 반복 요일 */}
      <Text style={styles.sectionTitle}>반복</Text>
      <View style={styles.daysRow}>
        {DAYS_OF_WEEK.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dayChip, repeatDays.includes(index) && styles.dayChipActive]}
            onPress={() => toggleDay(index)}
          >
            <Text style={[styles.dayText, repeatDays.includes(index) && styles.dayTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.quickDays}>
        <TouchableOpacity style={styles.quickChip} onPress={() => quickSetDays('daily')}>
          <Text style={styles.quickText}>매일</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => quickSetDays('weekday')}>
          <Text style={styles.quickText}>평일</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => quickSetDays('weekend')}>
          <Text style={styles.quickText}>주말</Text>
        </TouchableOpacity>
      </View>

      {/* 스누즈 */}
      <Text style={styles.sectionTitle}>스누즈</Text>
      <View style={styles.snoozeRow}>
        {[5, 10, 15].map((min) => (
          <TouchableOpacity
            key={min}
            style={[styles.snoozeChip, snooze === min && styles.snoozeChipActive]}
            onPress={() => setSnooze(min)}
          >
            <Text style={[styles.snoozeText, snooze === min && styles.snoozeTextActive]}>
              {min}분
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 메시지 선택 */}
      <Text style={styles.sectionTitle}>알람 메시지</Text>
      {!messages || messages.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyMessage}
          onPress={() => router.push('/message/create')}
        >
          <Text style={styles.emptyMessageText}>
            먼저 음성 메시지를 만들어주세요 →
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.messageList}>
          {messages.map((msg: Message) => (
            <TouchableOpacity
              key={msg.id}
              style={[
                styles.messageItem,
                selectedMessageId === msg.id && styles.messageItemSelected,
              ]}
              onPress={() => setSelectedMessageId(msg.id)}
            >
              <View style={styles.messageInfo}>
                <Text style={styles.messageVoice}>🗣️ {msg.voice_name}</Text>
                <Text style={styles.messageText} numberOfLines={1}>
                  "{msg.text}"
                </Text>
              </View>
              {selectedMessageId === msg.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 생성 버튼 */}
      <TouchableOpacity
        style={[
          styles.createButton,
          (!selectedMessageId || createMutation.isPending) && styles.disabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedMessageId || createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.createText}>⏰ 알람 설정하기</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  timePickerContainer: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeArrow: {
    padding: Spacing.sm,
  },
  arrowText: {
    fontSize: 20,
    color: Colors.light.primary,
  },
  timeValue: {
    fontSize: 56,
    fontWeight: '200',
    color: Colors.light.text,
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.light.text,
    marginHorizontal: Spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dayChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#FFF',
  },
  quickDays: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surfaceVariant,
  },
  quickText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  snoozeChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  snoozeChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  snoozeText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    fontWeight: '600',
  },
  snoozeTextActive: {
    color: '#FFF',
  },
  emptyMessage: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyMessageText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  messageList: {
    gap: Spacing.sm,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  messageItemSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surfaceVariant,
  },
  messageInfo: {
    flex: 1,
  },
  messageVoice: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    marginTop: 2,
  },
  checkmark: {
    fontSize: FontSize.lg,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  createText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  targetRow: {
    marginBottom: Spacing.sm,
  },
  targetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: Spacing.sm,
  },
  targetChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  targetText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    fontWeight: '600',
  },
  targetTextActive: {
    color: '#FFF',
  },
  targetHint: {
    fontSize: FontSize.sm,
    color: Colors.light.accent,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
});
