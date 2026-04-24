import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getFamilyGroupCurrent,
  createFamilyAlarmText,
  getUserProfile,
} from '../../src/services/api';
import type { FamilyGroupMember } from '../../src/services/api';
import {
  filterFamilyAlarmRecipients,
  validateFamilyAlarmForm,
  buildMemberDisplayName,
} from '../../src/lib/familyAlarmForm';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';
import { useAppStore } from '../../src/stores/useAppStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function FamilyAlarmCreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isConnected = useNetworkStatus();

  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [wakeAt, setWakeAt] = useState('07:00');
  const [messageText, setMessageText] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
    enabled: isAuthenticated && isConnected,
  });

  const { data: familyData, isLoading } = useQuery({
    queryKey: ['family-group'],
    queryFn: getFamilyGroupCurrent,
    enabled: isAuthenticated && isConnected,
  });

  const selfUserId = profile?.id ?? '';
  const allowedRecipients = useMemo(
    () => (familyData?.members ? filterFamilyAlarmRecipients(familyData.members, selfUserId) : []),
    [familyData?.members, selfUserId],
  );

  const createMutation = useMutation({
    mutationFn: createFamilyAlarmText,
    onSuccess: () => {
      Alert.alert(t('familyAlarm.successTitle'), t('familyAlarm.successDesc'), [
        { text: t('common.confirm'), onPress: () => router.back() },
      ]);
    },
    onError: () => {
      toast.show(t('familyAlarm.createError'));
    },
  });

  const toggleDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = () => {
    const result = validateFamilyAlarmForm({
      recipientUserId: selectedRecipient,
      wakeAt,
      messageText,
      repeatDays,
    });
    if (!result.ok) {
      toast.show(result.error);
      return;
    }
    createMutation.mutate(result.payload);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!familyData?.group) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.emptyText}>{t('people.noGroup')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (allowedRecipients.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔇</Text>
          <Text style={styles.emptyText}>{t('familyAlarm.noRecipients')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{t('familyAlarm.recipient')}</Text>
        <View style={styles.recipientRow}>
          {allowedRecipients.map((m: FamilyGroupMember) => {
            const selected = selectedRecipient === m.user_id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.recipientChip, selected && styles.recipientChipActive]}
                onPress={() => setSelectedRecipient(m.user_id)}
              >
                <Text style={[styles.recipientText, selected && styles.recipientTextActive]}>
                  {buildMemberDisplayName(m)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>{t('familyAlarm.wakeTime')}</Text>
        <TextInput
          style={styles.timeInput}
          value={wakeAt}
          onChangeText={setWakeAt}
          placeholder="07:00"
          placeholderTextColor={Colors.light.textTertiary}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />

        <Text style={styles.sectionLabel}>{t('familyAlarm.message')}</Text>
        <TextInput
          style={styles.messageInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder={t('familyAlarm.messagePlaceholder')}
          placeholderTextColor={Colors.light.textTertiary}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{messageText.length}/500</Text>

        <Text style={styles.sectionLabel}>{t('familyAlarm.repeat')}</Text>
        <View style={styles.daysRow}>
          {DAY_LABELS.map((label, idx) => {
            const active = repeatDays.includes(idx);
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => toggleDay(idx)}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {repeatDays.length === 0 && (
          <Text style={styles.repeatHint}>{t('familyAlarm.onceHint')}</Text>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          <Text style={styles.submitBtnText}>
            {createMutation.isPending ? t('familyAlarm.sending') : t('familyAlarm.submit')}
          </Text>
        </TouchableOpacity>
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
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  recipientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  recipientChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  recipientChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  recipientText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  recipientTextActive: {
    color: '#FFF',
    fontFamily: FontFamily.semibold,
  },
  timeInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.xl,
    color: Colors.light.text,
    textAlign: 'center',
    minHeight: 56,
  },
  messageInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.light.text,
    minHeight: 100,
    lineHeight: 22,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    fontFamily: FontFamily.medium,
  },
  dayTextActive: {
    color: '#FFF',
    fontFamily: FontFamily.semibold,
  },
  repeatHint: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginTop: Spacing.xs,
  },
  submitBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    minHeight: 52,
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
