import { useState, useMemo } from 'react';
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
import { Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';
import { useTheme, type ThemeColors } from '../../src/hooks/useTheme';
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
  const { colors } = useTheme();
  const dynStyles = useMemo(() => createStyles(colors), [colors]);

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
    <ScrollView style={dynStyles.container} contentContainerStyle={dynStyles.content}>
      {/* 누구에게? */}
      {friends && friends.length > 0 && (
        <>
          <Text style={dynStyles.sectionTitle}>{t('alarmCreate.forWho')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynStyles.targetRow}>
            <TouchableOpacity
              style={[dynStyles.targetChip, !targetUserId && dynStyles.targetChipActive]}
              onPress={() => {
                setTargetUserId(null);
                setTargetName(null);
              }}
            >
              <Text style={[dynStyles.targetText, !targetUserId && dynStyles.targetTextActive]}>
                {t('alarmCreate.forMe')}
              </Text>
            </TouchableOpacity>
            {friends.map((f: Friend) => {
              const friendId = f.user_a === userId ? f.user_b : f.user_a;
              const isSelected = targetUserId === friendId;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[dynStyles.targetChip, isSelected && dynStyles.targetChipActive]}
                  onPress={() => {
                    setTargetUserId(isSelected ? null : friendId);
                    setTargetName(isSelected ? null : f.friend_name || f.friend_email || null);
                  }}
                >
                  <Text style={[dynStyles.targetText, isSelected && dynStyles.targetTextActive]}>
                    {f.friend_name || f.friend_email?.split('@')[0] || '?'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {targetName && (
            <Text style={dynStyles.targetHint}>
              {t('alarmCreate.targetHint', { name: targetName })}
            </Text>
          )}
        </>
      )}

      {/* 시간 선택 */}
      <Text style={dynStyles.sectionTitle}>{t('alarmCreate.time')}</Text>
      <View style={dynStyles.timePickerContainer}>
        <View style={dynStyles.timePicker}>
          {/* 시 */}
          <View style={dynStyles.timeColumn}>
            <TouchableOpacity style={dynStyles.timeArrow} onPress={() => setHour((h) => (h + 1) % 24)}>
              <Text style={dynStyles.arrowText}>▲</Text>
            </TouchableOpacity>
            <Text style={dynStyles.timeValue}>{hour.toString().padStart(2, '0')}</Text>
            <TouchableOpacity
              style={dynStyles.timeArrow}
              onPress={() => setHour((h) => (h - 1 + 24) % 24)}
            >
              <Text style={dynStyles.arrowText}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={dynStyles.timeSeparator}>:</Text>

          {/* 분 */}
          <View style={dynStyles.timeColumn}>
            <TouchableOpacity
              style={dynStyles.timeArrow}
              onPress={() => setMinute((m) => (m + 5) % 60)}
            >
              <Text style={dynStyles.arrowText}>▲</Text>
            </TouchableOpacity>
            <Text style={dynStyles.timeValue}>{minute.toString().padStart(2, '0')}</Text>
            <TouchableOpacity
              style={dynStyles.timeArrow}
              onPress={() => setMinute((m) => (m - 5 + 60) % 60)}
            >
              <Text style={dynStyles.arrowText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 반복 요일 */}
      <Text style={dynStyles.sectionTitle}>{t('alarmCreate.repeat')}</Text>
      <View style={dynStyles.daysRow}>
        {DAYS_OF_WEEK.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[dynStyles.dayChip, repeatDays.includes(index) && dynStyles.dayChipActive]}
            onPress={() => toggleDay(index)}
          >
            <Text style={[dynStyles.dayText, repeatDays.includes(index) && dynStyles.dayTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={dynStyles.quickDays}>
        <TouchableOpacity style={dynStyles.quickChip} onPress={() => quickSetDays('daily')}>
          <Text style={dynStyles.quickText}>{t('alarms.daily')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dynStyles.quickChip} onPress={() => quickSetDays('weekday')}>
          <Text style={dynStyles.quickText}>{t('alarms.weekday')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dynStyles.quickChip} onPress={() => quickSetDays('weekend')}>
          <Text style={dynStyles.quickText}>{t('alarms.weekend')}</Text>
        </TouchableOpacity>
      </View>

      {/* 재생 모드 */}
      <Text style={dynStyles.sectionTitle}>재생 모드</Text>
      <View style={dynStyles.modeRow}>
        <TouchableOpacity
          style={[dynStyles.modeChip, mode === 'tts' && dynStyles.modeChipActive]}
          onPress={() => setMode('tts')}
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === 'tts' }}
        >
          <Text style={[dynStyles.modeText, mode === 'tts' && dynStyles.modeTextActive]}>
            🗣️ TTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dynStyles.modeChip, mode === 'sound-only' && dynStyles.modeChipActive]}
          onPress={() => setMode('sound-only')}
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === 'sound-only' }}
        >
          <Text style={[dynStyles.modeText, mode === 'sound-only' && dynStyles.modeTextActive]}>
            🔊 원본
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'sound-only' && (
        <>
          <Text style={dynStyles.sectionTitle}>음성 프로필</Text>
          {readyVoices.length === 0 ? (
            <View style={dynStyles.emptyVoiceBox}>
              <Text style={dynStyles.emptyVoiceText}>
                원본 재생 모드는 등록된 음성 프로필이 필요해요.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={dynStyles.voiceRow}
            >
              {readyVoices.map((v: VoiceProfile) => {
                const selected = voiceProfileId === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[dynStyles.voiceChip, selected && dynStyles.voiceChipActive]}
                    onPress={() => setVoiceProfileId(selected ? null : v.id)}
                  >
                    <Text style={[dynStyles.voiceText, selected && dynStyles.voiceTextActive]}>
                      {v.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {soundOnlyInvalid && (
            <Text style={dynStyles.voiceHint}>
              원본 재생 모드에서는 음성 프로필을 지정해야 합니다.
            </Text>
          )}
        </>
      )}

      {/* 스누즈 */}
      <Text style={dynStyles.sectionTitle}>{t('alarmCreate.snooze')}</Text>
      <View style={dynStyles.snoozeRow}>
        {[5, 10, 15].map((min) => (
          <TouchableOpacity
            key={min}
            style={[dynStyles.snoozeChip, snooze === min && dynStyles.snoozeChipActive]}
            onPress={() => setSnooze(min)}
          >
            <Text style={[dynStyles.snoozeText, snooze === min && dynStyles.snoozeTextActive]}>
              {t('alarmCreate.snoozeMin', { min })}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 메시지 선택 */}
      <Text style={dynStyles.sectionTitle}>{t('alarmCreate.message')}</Text>
      {messages && messages.length > 0 ? (
        <View style={dynStyles.messageList}>
          {messages.map((msg: Message) => (
            <TouchableOpacity
              key={msg.id}
              style={[
                dynStyles.messageItem,
                selectedMessageId === msg.id && dynStyles.messageItemSelected,
              ]}
              onPress={() => setSelectedMessageId(msg.id)}
            >
              <View style={dynStyles.messageInfo}>
                <Text style={dynStyles.messageVoice}>🗣️ {msg.voice_name}</Text>
                <Text style={dynStyles.messageText} numberOfLines={1}>
                  "{msg.text}"
                </Text>
              </View>
              {selectedMessageId === msg.id && <Text style={dynStyles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={dynStyles.emptyMessageBox}>
          <Text style={dynStyles.emptyMessageEmoji}>💬</Text>
          <Text style={dynStyles.emptyMessageTitle}>{t('alarmCreate.noMessages')}</Text>
          <Text style={dynStyles.emptyMessageDesc}>{t('alarmCreate.noMessagesDesc')}</Text>
          <View style={dynStyles.emptyMessageActions}>
            <TouchableOpacity
              style={dynStyles.emptyMessageBtn}
              onPress={() => router.push('/message/create')}
            >
              <Text style={dynStyles.emptyMessageBtnText}>{t('alarmCreate.goCreate')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 프리셋으로 빠르게 만들기 */}
      <TouchableOpacity
        style={dynStyles.presetToggle}
        onPress={() => setShowPreset((v) => !v)}
      >
        <Text style={dynStyles.presetToggleText}>
          {showPreset ? '▲' : '▼'} {t('alarmCreate.quickCreate')}
        </Text>
      </TouchableOpacity>

      {showPreset && (
        <View style={dynStyles.presetSection}>
          {/* 음성 선택 */}
          <Text style={dynStyles.presetLabel}>{t('alarmCreate.selectVoice')}</Text>
          {readyVoices.length === 0 ? (
            <TouchableOpacity
              style={dynStyles.emptyMessage}
              onPress={() => router.push('/voice/record')}
            >
              <Text style={dynStyles.emptyMessageText}>{t('alarmCreate.emptyVoice')}</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynStyles.presetRow}>
              {readyVoices.map((v: VoiceProfile) => (
                <TouchableOpacity
                  key={v.id}
                  style={[dynStyles.targetChip, presetVoiceId === v.id && dynStyles.targetChipActive]}
                  onPress={() => setPresetVoiceId(v.id)}
                >
                  <Text style={[dynStyles.targetText, presetVoiceId === v.id && dynStyles.targetTextActive]}>
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 카테고리 선택 */}
          <Text style={dynStyles.presetLabel}>{t('alarmCreate.presetCategory')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynStyles.presetRow}>
            {PRESET_CATEGORIES.map((cat: PresetCategory) => (
              <TouchableOpacity
                key={cat.key}
                style={[dynStyles.targetChip, presetCategory === cat.key && dynStyles.targetChipActive]}
                onPress={() => {
                  setPresetCategory(cat.key);
                  setPresetText(null);
                }}
              >
                <Text style={[dynStyles.targetText, presetCategory === cat.key && dynStyles.targetTextActive]}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 프리셋 메시지 목록 */}
          <View style={dynStyles.messageList}>
            {PRESET_CATEGORIES.find((c) => c.key === presetCategory)?.messages.map((msg, i) => (
              <TouchableOpacity
                key={i}
                style={[dynStyles.messageItem, presetText === msg && dynStyles.messageItemSelected]}
                onPress={() => setPresetText(msg)}
              >
                <View style={dynStyles.messageInfo}>
                  <Text style={dynStyles.messageText} numberOfLines={2}>"{msg}"</Text>
                </View>
                {presetText === msg && <Text style={dynStyles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* 생성 버튼 */}
          <TouchableOpacity
            style={[
              dynStyles.presetGenerateBtn,
              (!presetVoiceId || !presetText || ttsMutation.isPending) && dynStyles.disabled,
            ]}
            onPress={handlePresetGenerate}
            disabled={!presetVoiceId || !presetText || ttsMutation.isPending}
          >
            {ttsMutation.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={dynStyles.presetGenerateText}>{t('alarmCreate.generatePreset')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 생성 버튼 */}
      <TouchableOpacity
        style={[
          dynStyles.createButton,
          (!selectedMessageId || soundOnlyInvalid || createMutation.isPending) && dynStyles.disabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedMessageId || soundOnlyInvalid || createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={dynStyles.createText}>{t('alarmCreate.submit')}</Text>
        )}
      </TouchableOpacity>
      <Toast message={toast.message} opacity={toast.opacity} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  timePickerContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
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
    color: colors.primary,
  },
  timeValue: {
    fontSize: 56,
    fontFamily: FontFamily.regular,
    color: colors.text,
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 48,
    fontFamily: FontFamily.regular,
    color: colors.text,
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
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: FontSize.md,
    color: colors.text,
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
    backgroundColor: colors.surfaceVariant,
  },
  quickText: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  snoozeChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  snoozeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  snoozeText: {
    fontSize: FontSize.md,
    color: colors.text,
    fontFamily: FontFamily.semibold,
  },
  snoozeTextActive: {
    color: '#FFF',
  },
  emptyMessage: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyMessageText: {
    color: colors.primary,
    fontFamily: FontFamily.semibold,
  },
  emptyMessageBox: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyMessageEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyMessageTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  emptyMessageDesc: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  emptyMessageActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  emptyMessageBtn: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceVariant,
  },
  messageInfo: {
    flex: 1,
  },
  messageVoice: {
    fontSize: FontSize.sm,
    color: colors.primary,
    fontFamily: FontFamily.semibold,
  },
  messageText: {
    fontSize: FontSize.md,
    color: colors.text,
    marginTop: 2,
  },
  checkmark: {
    fontSize: FontSize.lg,
    color: colors.primary,
    fontFamily: FontFamily.bold,
  },
  createButton: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: Spacing.sm,
  },
  targetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  targetText: {
    fontSize: FontSize.md,
    color: colors.text,
    fontFamily: FontFamily.semibold,
  },
  targetTextActive: {
    color: '#FFF',
  },
  targetHint: {
    fontSize: FontSize.sm,
    color: colors.accent,
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
    color: colors.primary,
    fontFamily: FontFamily.semibold,
  },
  presetSection: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  presetLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  presetRow: {
    marginBottom: Spacing.sm,
  },
  presetGenerateBtn: {
    backgroundColor: colors.accent,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: {
    fontSize: FontSize.md,
    color: colors.text,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: Spacing.sm,
  },
  voiceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  voiceText: {
    fontSize: FontSize.md,
    color: colors.text,
    fontFamily: FontFamily.semibold,
  },
  voiceTextActive: {
    color: '#FFF',
  },
  voiceHint: {
    fontSize: FontSize.sm,
    color: colors.error,
    marginTop: Spacing.xs,
  },
  emptyVoiceBox: {
    backgroundColor: colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyVoiceText: {
    color: colors.textSecondary,
    fontSize: FontSize.sm,
  },
  });
}
