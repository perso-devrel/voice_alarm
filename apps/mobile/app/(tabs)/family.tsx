import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  createFamilyAlarmText,
  getFamilyGroupCurrent,
  getUserProfile,
  type FamilyGroupMember,
} from '../../src/services/api';
import {
  buildMemberDisplayName,
  filterFamilyAlarmRecipients,
  validateFamilyAlarmForm,
} from '../../src/lib/familyAlarmForm';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getApiErrorMessage } from '../../src/types';

const WEEKDAYS: { label: string; value: number }[] = [
  { label: '일', value: 0 },
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
];

export default function FamilyScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ['familyGroupCurrent'],
    queryFn: getFamilyGroupCurrent,
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
  });
  const selfUserId = profile?.id ?? '';

  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);
  const [wakeAt, setWakeAt] = useState('07:30');
  const [messageText, setMessageText] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const allowedRecipients = useMemo(
    () => filterFamilyAlarmRecipients(group?.members ?? [], selfUserId),
    [group, selfUserId],
  );

  const createMutation = useMutation({
    mutationFn: createFamilyAlarmText,
    onSuccess: (res) => {
      setSuccessMsg(`알람이 예약되었습니다 (${res.alarm.wake_at}).`);
      setFormError(null);
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, '알람 예약에 실패했습니다.'));
      setSuccessMsg(null);
    },
  });

  function toggleDay(d: number) {
    setRepeatDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  }

  function handleSubmit() {
    setSuccessMsg(null);
    const res = validateFamilyAlarmForm({
      recipientUserId,
      wakeAt,
      messageText,
      repeatDays,
    });
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setFormError(null);
    createMutation.mutate(res.payload);
  }

  if (loadingGroup) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerContainer} accessibilityRole="progressbar">
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>가족 그룹을 불러오는 중…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group?.group) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{t('tab.family', '가족 알람')}</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 가족 그룹이 없어요</Text>
            <Text style={styles.emptyDesc}>
              설정에서 가족 플랜을 결제하거나 초대 코드를 입력해 참여해 주세요.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('tab.family', '가족 알람')}</Text>

        <Text style={styles.sectionTitle}>가족 그룹 멤버</Text>
        <View style={styles.memberList}>
          {group.members.map((m) => (
            <MemberRow key={m.id} member={m} isSelf={m.user_id === selfUserId} />
          ))}
        </View>

        {allowedRecipients.length === 0 ? (
          <View style={styles.infoCard} accessibilityRole="alert">
            <Text style={styles.infoText}>
              가족 알람을 허용한 멤버가 없습니다. 각자 설정에서 '가족이 내게 알람 추가 허용'을 켜야
              알람을 예약할 수 있습니다.
            </Text>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>수신자</Text>
            <View style={styles.recipientRow}>
              {allowedRecipients.map((m) => {
                const active = recipientUserId === m.user_id;
                return (
                  <TouchableOpacity
                    key={m.user_id}
                    onPress={() => setRecipientUserId(m.user_id)}
                    style={[styles.recipientChip, active && styles.recipientChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.recipientChipText,
                        active && styles.recipientChipTextActive,
                      ]}
                    >
                      {buildMemberDisplayName(m)}
                      {m.role === 'owner' ? ' (소유자)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.formLabel}>기상 시간 (HH:mm)</Text>
            <TextInput
              value={wakeAt}
              onChangeText={setWakeAt}
              placeholder="07:30"
              placeholderTextColor={Colors.light.textTertiary}
              maxLength={5}
              keyboardType="numbers-and-punctuation"
              style={styles.input}
              accessibilityLabel="기상 시간"
            />

            <Text style={styles.formLabel}>메시지 (최대 500자)</Text>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="예: 좋은 아침! 오늘도 힘내자"
              placeholderTextColor={Colors.light.textTertiary}
              multiline
              numberOfLines={3}
              maxLength={500}
              style={[styles.input, styles.textarea]}
              accessibilityLabel="알람 메시지 내용"
            />
            <Text style={styles.counter}>{messageText.length}/500</Text>

            <Text style={styles.formLabel}>반복 요일 (선택)</Text>
            <View style={styles.daysRow}>
              {WEEKDAYS.map(({ label, value }) => {
                const active = repeatDays.includes(value);
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => toggleDay(value)}
                    style={[styles.dayPill, active && styles.dayPillActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {formError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {formError}
              </Text>
            ) : null}
            {successMsg ? (
              <Text style={styles.successText} accessibilityRole="text">
                {successMsg}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              accessibilityRole="button"
            >
              <Text style={styles.submitText}>
                {createMutation.isPending ? '예약 중…' : '알람 예약'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MemberRow({ member, isSelf }: { member: FamilyGroupMember; isSelf: boolean }) {
  const label = buildMemberDisplayName(member);
  const roleBadge = member.role === 'owner' ? '소유자' : '멤버';
  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{label.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {label}
          </Text>
          {isSelf && <Text style={styles.memberSelfTag}>(나)</Text>}
        </View>
        <Text style={styles.memberRole}>{roleBadge}</Text>
      </View>
      <View
        style={[
          styles.allowBadge,
          member.allow_family_alarms ? styles.allowBadgeOn : styles.allowBadgeOff,
        ]}
      >
        <Text
          style={[
            styles.allowBadgeText,
            member.allow_family_alarms ? styles.allowBadgeTextOn : styles.allowBadgeTextOff,
          ]}
        >
          {member.allow_family_alarms ? '알람 허용' : '알람 거부'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.light.textSecondary, fontSize: FontSize.sm },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  memberList: { gap: Spacing.sm, marginBottom: Spacing.lg },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: '#FFFFFF', fontWeight: '700' },
  memberInfo: { flex: 1, minWidth: 0 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberName: { fontWeight: '600', color: Colors.light.text, fontSize: FontSize.md },
  memberSelfTag: { fontSize: FontSize.xs, color: Colors.light.textTertiary },
  memberRole: { fontSize: FontSize.xs, color: Colors.light.textSecondary },
  allowBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  allowBadgeOn: { backgroundColor: '#DCFCE7' },
  allowBadgeOff: { backgroundColor: Colors.light.border },
  allowBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  allowBadgeTextOn: { color: Colors.light.success },
  allowBadgeTextOff: { color: Colors.light.textTertiary },
  emptyCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.light.text },
  emptyDesc: { color: Colors.light.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  infoCard: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.lg,
  },
  infoText: { color: Colors.light.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  formCard: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: Spacing.xs,
  },
  recipientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  recipientChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  recipientChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  recipientChipText: { fontSize: FontSize.sm, color: Colors.light.text, fontWeight: '600' },
  recipientChipTextActive: { color: '#FFFFFF' },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surfaceVariant,
    color: Colors.light.text,
    fontSize: FontSize.md,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  counter: {
    textAlign: 'right',
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
  },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: { backgroundColor: Colors.light.primary },
  dayText: { fontSize: FontSize.sm, color: Colors.light.textSecondary, fontWeight: '700' },
  dayTextActive: { color: '#FFFFFF' },
  errorText: { color: Colors.light.error, fontSize: FontSize.sm },
  successText: { color: Colors.light.success, fontSize: FontSize.sm },
  submitBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: FontSize.md },
});
