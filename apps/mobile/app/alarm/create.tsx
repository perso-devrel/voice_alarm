import { useState } from 'react';
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
import { DAYS_OF_WEEK, PRESET_CATEGORIES } from '../../src/constants/presets';
import type { PresetCategory } from '../../src/constants/presets';
import {
  getMessages,
  getAlarms,
  createAlarm,
  getFriendList,
  getVoiceProfiles,
  generateTTS,
} from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { syncAlarmNotifications } from '../../src/services/notifications';
import type { AlarmMode, Friend, Message, VoiceProfile } from '../../src/types';
import { getApiErrorMessage } from '../../src/types';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';
import { validateAlarmForm } from '../../src/lib/alarmForm';

export default function CreateAlarmScreen() {
  const router = useRouter();
  const { message_id: paramMessageId } = useLocalSearchParams<{ message_id?: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated, userId, defaultSnoozeMinutes } = useAppStore();
  const { t } = useTranslation();
  const toast = useToast();

  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(paramMessageId ?? null);
  const [snooze, setSnooze] = useState(defaultSnoozeMinutes);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string | null>(null);
  const [showPreset, setShowPreset] = useState(false);
  const [presetCategory, setPresetCategory] = useState<string>('morning');
  const [presetText, setPresetText] = useState<string | null>(null);
  const [presetVoiceId, setPresetVoiceId] = useState<string | null>(null);
  const [mode, setMode] = useState<AlarmMode>('tts');
  const [voiceProfileId, setVoiceProfileId] = useState<string | null>(null);

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

  const readyVoices = voices?.filter((v: VoiceProfile) => v.status === 'ready') ?? [];

  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriendList,
    enabled: isAuthenticated,
  });

  const ttsMutation = useMutation({
    mutationFn: generateTTS,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelectedMessageId(data.message_id);
      setShowPreset(false);
      setPresetText(null);
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('alarmCreate.ttsError')));
    },
  });

  const handlePresetGenerate = () => {
    if (!presetVoiceId || !presetText) return;
    ttsMutation.mutate({
      voice_profile_id: presetVoiceId,
      text: presetText,
      category: presetCategory,
    });
  };

  const createMutation = useMutation({
    mutationFn: createAlarm,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      const alarms = await getAlarms();
      syncAlarmNotifications(alarms);
      Alert.alert(t('alarmCreate.successTitle'), t('alarmCreate.successDesc'), [
        { text: t('common.confirm'), onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('alarmCreate.createError')));
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
      targetUserId,
    });
    if (!validated.ok) {
      toast.show(validated.error);
      return;
    }
    createMutation.mutate(validated.payload);
  };

  const soundOnlyInvalid = mode === 'sound-only' && !voiceProfileId;

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
          <Text style={styles.sectionTitle}>{t('alarmCreate.forWho')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetRow}>
            <TouchableOpacity
              style={[styles.targetChip, !targetUserId && styles.targetChipActive]}
              onPress={() => {
                setTargetUserId(null);
                setTargetName(null);
              }}
            >
              <Text style={[styles.targetText, !targetUserId && styles.targetTextActive]}>
                {t('alarmCreate.forMe')}
              </Text>
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
                    setTargetName(isSelected ? null : f.friend_name || f.friend_email || null);
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
            <Text style={styles.targetHint}>
              {t('alarmCreate.targetHint', { name: targetName })}
            </Text>
          )}
        </>
      )}

      {/* 시간 선택 */}
      <Text style={styles.sectionTitle}>{t('alarmCreate.time')}</Text>
      <View style={styles.timePickerContainer}>
        <View style={styles.timePicker}>
          {/* 시 */}
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
              {readyVoices.map((v: VoiceProfile) => {
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
          <View style={styles.emptyMessageActions}>
            <TouchableOpacity
              style={styles.emptyMessageBtn}
              onPress={() => router.push('/message/create')}
            >
              <Text style={styles.emptyMessageBtnText}>{t('alarmCreate.goCreate')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 프리셋으로 빠르게 만들기 */}
      <TouchableOpacity
        style={styles.presetToggle}
        onPress={() => setShowPreset((v) => !v)}
      >
        <Text style={styles.presetToggleText}>
          {showPreset ? '▲' : '▼'} {t('alarmCreate.quickCreate')}
        </Text>
      </TouchableOpacity>

      {showPreset && (
        <View style={styles.presetSection}>
          {/* 음성 선택 */}
          <Text style={styles.presetLabel}>{t('alarmCreate.selectVoice')}</Text>
          {readyVoices.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyMessage}
              onPress={() => router.push('/voice/record')}
            >
              <Text style={styles.emptyMessageText}>{t('alarmCreate.emptyVoice')}</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
              {readyVoices.map((v: VoiceProfile) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.targetChip, presetVoiceId === v.id && styles.targetChipActive]}
                  onPress={() => setPresetVoiceId(v.id)}
                >
                  <Text style={[styles.targetText, presetVoiceId === v.id && styles.targetTextActive]}>
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 카테고리 선택 */}
          <Text style={styles.presetLabel}>{t('alarmCreate.presetCategory')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
            {PRESET_CATEGORIES.map((cat: PresetCategory) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.targetChip, presetCategory === cat.key && styles.targetChipActive]}
                onPress={() => {
                  setPresetCategory(cat.key);
                  setPresetText(null);
                }}
              >
                <Text style={[styles.targetText, presetCategory === cat.key && styles.targetTextActive]}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 프리셋 메시지 목록 */}
          <View style={styles.messageList}>
            {PRESET_CATEGORIES.find((c) => c.key === presetCategory)?.messages.map((msg, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.messageItem, presetText === msg && styles.messageItemSelected]}
                onPress={() => setPresetText(msg)}
              >
                <View style={styles.messageInfo}>
                  <Text style={styles.messageText} numberOfLines={2}>"{msg}"</Text>
                </View>
                {presetText === msg && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* 생성 버튼 */}
          <TouchableOpacity
            style={[
              styles.presetGenerateBtn,
              (!presetVoiceId || !presetText || ttsMutation.isPending) && styles.disabled,
            ]}
            onPress={handlePresetGenerate}
            disabled={!presetVoiceId || !presetText || ttsMutation.isPending}
          >
            {ttsMutation.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.presetGenerateText}>{t('alarmCreate.generatePreset')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 생성 버튼 */}
      <TouchableOpacity
        style={[
          styles.createButton,
          (!selectedMessageId || soundOnlyInvalid || createMutation.isPending) && styles.disabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedMessageId || soundOnlyInvalid || createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.createText}>{t('alarmCreate.submit')}</Text>
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
  emptyMessage: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyMessageText: {
    color: Colors.light.primary,
    fontFamily: FontFamily.semibold,
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
    marginBottom: Spacing.md,
  },
  emptyMessageActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  emptyMessageBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  emptyMessageBtnText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
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
    fontFamily: FontFamily.bold,
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
    fontFamily: FontFamily.semibold,
  },
  targetTextActive: {
    color: '#FFF',
  },
  targetHint: {
    fontSize: FontSize.sm,
    color: Colors.light.accent,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.sm,
  },
  presetToggle: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  presetToggleText: {
    fontSize: FontSize.md,
    color: Colors.light.primary,
    fontFamily: FontFamily.semibold,
  },
  presetSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  presetLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  presetRow: {
    marginBottom: Spacing.sm,
  },
  presetGenerateBtn: {
    backgroundColor: Colors.light.accent,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  presetGenerateText: {
    color: '#FFF',
    fontSize: FontSize.md,
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
