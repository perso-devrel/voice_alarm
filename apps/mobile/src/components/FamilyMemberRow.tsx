import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FamilyGroupMember } from '../services/api';
import { buildMemberDisplayName } from '../lib/familyAlarmForm';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../constants/theme';

interface Props {
  member: FamilyGroupMember;
  isCouple?: boolean;
}

export function FamilyMemberRow({ member, isCouple }: Props) {
  const { t } = useTranslation();
  const displayName = buildMemberDisplayName(member);

  return (
    <View style={[styles.card, isCouple && styles.coupleCard]}>
      <View style={[styles.avatar, member.role === 'owner' && styles.ownerAvatar]}>
        <Text style={styles.avatarText}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{displayName}</Text>
          <View style={[styles.roleBadge, member.role === 'owner' ? styles.ownerBadge : styles.memberBadge]}>
            <Text style={styles.roleBadgeText}>
              {member.role === 'owner' ? t('people.owner') : t('people.member')}
            </Text>
          </View>
        </View>
        {member.email && <Text style={styles.email}>{member.email}</Text>}
        {member.allow_family_alarms && (
          <Text style={styles.alarmAllowed}>⏰ {t('people.alarmAllowed')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  coupleCard: {
    borderWidth: 1,
    borderColor: Colors.light.primaryLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  ownerAvatar: {
    backgroundColor: Colors.light.primary,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.light.primaryDark,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: Colors.light.text,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  ownerBadge: {
    backgroundColor: `${Colors.light.primary}20`,
  },
  memberBadge: {
    backgroundColor: Colors.light.surfaceVariant,
  },
  roleBadgeText: {
    fontSize: FontSize.xs - 1,
    fontFamily: FontFamily.semibold,
    color: Colors.light.textSecondary,
  },
  alarmAllowed: {
    fontSize: FontSize.xs,
    color: Colors.light.success,
    marginTop: 2,
  },
});
