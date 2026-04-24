import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';
import { DAYS_OF_WEEK } from '../../src/constants/presets';
import {
  getMessages,
  getAlarm,
  getAlarms,
  updateAlarm,
  getVoiceProfiles,
} from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { syncAlarmNotifications } from '../../src/services/notifications';
import type { AlarmMode, Message, VoiceProfile } from '../../src/types';
import { getApiErrorMessage } from '../../src/types';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';
import { parseRepeatDays, validateAlarmForm } from '../../src/lib/alarmForm';

export default function EditAlarmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAppStore();
  const { t } = useTranslation();
  const toast = useToast();

  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [snooze, setSnooze] = useState(5);
  const [mode, setMode] = useState<AlarmMode>('tts');
  const [voiceProfileId, setVoiceProfileId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const { data: alarm } = useQuery({
    queryKey: ['alarm', id],
    queryFn: () => getAlarm(id!),
    enabled: isAuthenticated && !!id,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
    enabled: isAuthenticated,
  });

  const { data: voices } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: isAuthenticated,
  });

  const readyVoices: VoiceProfile[] =
    voices?.filter((v: VoiceProfile) => v.status === 'ready') ?? [];

  useEffect(() => {
    if (alarm && !loaded) {
      const [h, m] = alarm.time.split(':').map(Number);
      setHour(h);
      setMinute(m);
      setRepeatDays(parseRepeatDays(alarm.repeat_days));
      setSelectedMessageId(alarm.message_id);
      setSnooze(alarm.snooze_minutes);
      setMode(alarm.mode === 'sound-only' ? 'sound-only' : 'tts');
      setVoiceProfileId(alarm.voice_profile_id ?? null);
      setLoaded(true);
    }
  }, [alarm, loaded]);

  const editMutation = useMutation({
    mutationFn: (params: {
      time?: string;
      repeat_days?: number[];
      snooze_minutes?: number;
      message_id?: string;
      mode?: AlarmMode;
      voice_profile_id?: string | null;
    }) => updateAlarm(id!, params),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      const fresh = await getAlarms();
      syncAlarmNotifications(fresh);
      Alert.alert(t('alarmEdit.successTitle'), t('alarmEdit.successDesc'), [
        { text: t('common.confirm'), onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('alarmEdit.editError')));
    },
  });

  const toggleDay = (day: number) => {
    setRepeatDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = () => {
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const validated = validateAlarmForm({
      messageId: selectedMessageId,
      time,
      repeatDays,
      mode,
      voiceProfileId,
      snoozeMinutes: snooze,
    });
    if (!validated.ok) {
      toast.show(validated.error);
      return;
    }
    const { payload } = validated;
    editMutation.mutate({
      message_id: payload.message_id,
      time: payload.time,
      repeat_days: payload.repeat_days,
      snooze_minutes: payload.snooze_minutes,
      mode: payload.mode,
      voice_profile_id: payload.voice_profile_id ?? null,
    });
  };

  const soundOnlyInvalid = mode === 'sound-only' && !voiceProfileId;

  const quickSetDays = (type: 'daily' | 'weekday' | 'weekend') => {
    if (type === 'daily') setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
    else if (type === 'weekday') setRepeatDays([1, 2, 3, 4, 5]);
    else setRepeatDays([0, 6]);
  };

  if (!alarm && !loaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.light.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>{t('alarmEdit.title')}</Text>

      {/* 시간 선택 */}
      <Text style={styles.sectionTitle}>{t('alarmCreate.time')}</Text>
      <View style={styles.timePickerContainer}>
        <View style={styles.timePicker}>
          <View style={styles.timeColumn}>
            <TouchableOpacity style={styles.timeArrow} onPress={() => setHour((h) => (h + 1) % 24)}>
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
      <Text style={styles.sectionTitle}>{t('alarmCreate.repeat')}</Text>
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
          <Text style={styles.quickText}>{t('alarms.daily')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => quickSetDays('weekday')}>
          <Text style={styles.quickText}>{t('alarms.weekday')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => quickSetDays('weekend')}>
          <Text style={styles.quickText}>{t('alarms.weekend')}</Text>
        </TouchableOpacity>
      </View>

      {/* 재생 모드 */}
      <Text style={styles.sectionTitle}>재생 모드</Text>
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'tts' && styles.modeChipActive]}
          onPress={() => setMode('tts')}
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === 'tts' }}
        >
          <Text style={[styles.modeText, mode === 'tts' && styles.modeTextActive]}>
            🗣️ TTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'sound-only' && styles.modeChipActive]}
          onPress={() => setMode('sound-only')}
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === 'sound-only' }}
        >
          <Text style={[styles.modeText, mode === 'sound-only' && styles.modeTextActive]}>
            🔊 원본
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'sound-only' && (
        <>
          <Text style={styles.sectionTitle}>음성 프로필</Text>
          {readyVoices.length === 0 ? (
            <View style={styles.emptyVoiceBox}>
              <Text style={styles.emptyVoiceText}>
                원본 재생 모드는 등록된 음성 프로필이 필요해요.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.voiceRow}
            >
              {readyVoices.map((v) => {
                const selected = voiceProfileId === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.voiceChip, selected && styles.voiceChipActive]}
                    onPress={() => setVoiceProfileId(selected ? null : v.id)}
                  >
                    <Text style={[styles.voiceText, selected && styles.voiceTextActive]}>
                      {v.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {soundOnlyInvalid && (
            <Text style={styles.voiceHint}>
              원본 재생 모드에서는 음성 프로필을 지정해야 합니다.
            </Text>
          )}
        </>
      )}

      {/* 스누즈 */}
      <Text style={styles.sectionTitle}>{t('alarmCreate.snooze')}</Text>
      <View style={styles.snoozeRow}>
        {[5, 10, 15].map((min) => (
          <TouchableOpacity
            key={min}
            style={[styles.snoozeChip, snooze === min && styles.snoozeChipActive]}
            onPress={() => setSnooze(min)}
          >
            <Text style={[styles.snoozeText, snooze === min && styles.snoozeTextActive]}>
              {t('alarmCreate.snoozeMin', { min })}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 메시지 선택 */}
      <Text style={styles.sectionTitle}>{t('alarmCreate.message')}</Text>
      {messages && messages.length > 0 ? (
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
              {selectedMessageId === msg.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyMessageBox}>
          <Text style={styles.emptyMessageEmoji}>💬</Text>
          <Text style={styles.emptyMessageTitle}>{t('alarmCreate.noMessages')}</Text>
          <Text style={styles.emptyMessageDesc}>{t('alarmCreate.noMessagesDesc')}</Text>
        </View>
      )}

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          (!selectedMessageId || soundOnlyInvalid || editMutation.isPending) && styles.disabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedMessageId || soundOnlyInvalid || editMutation.isPending}
      >
        {editMutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveText}>{t('alarmEdit.save')}</Text>
        )}
      </TouchableOpacity>
      <Toast message={toast.message} opacity={toast.opacity} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  screenTitle: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
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
    fontFamily: FontFamily.regular,
    color: Colors.light.text,
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 48,
    fontFamily: FontFamily.regular,
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
    fontFamily: FontFamily.semibold,
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
    fontFamily: FontFamily.semibold,
  },
  snoozeTextActive: {
    color: '#FFF',
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
    fontFamily: FontFamily.semibold,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    marginTop: 2,
  },
  checkmark: {
    fontSize: FontSize.lg,
    color: Colors.light.primary,
    fontFamily: FontFamily.bold,
  },
  emptyMessageBox: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  emptyMessageEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyMessageTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  emptyMessageDesc: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  saveText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  modeText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    fontFamily: FontFamily.semibold,
  },
  modeTextActive: {
    color: '#FFF',
  },
  voiceRow: {
    flexDirection: 'row',
  },
  voiceChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: Spacing.sm,
  },
  voiceChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  voiceText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    fontFamily: FontFamily.semibold,
  },
  voiceTextActive: {
    color: '#FFF',
  },
  voiceHint: {
    fontSize: FontSize.sm,
    color: Colors.light.error,
    marginTop: Spacing.xs,
  },
  emptyVoiceBox: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  emptyVoiceText: {
    color: Colors.light.textSecondary,
    fontSize: FontSize.sm,
  },
});
