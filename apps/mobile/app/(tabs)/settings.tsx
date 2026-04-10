import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useAppStore } from '../../src/stores/useAppStore';
import { getUserProfile, deleteAccount } from '../../src/services/api';
import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getAudioCacheSize } from '../../src/services/audio';

export default function SettingsScreen() {
  const { plan, isAuthenticated, clearAuth, defaultSnoozeMinutes, setDefaultSnoozeMinutes } = useAppStore();
  const [cacheSize, setCacheSize] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>('undetermined');
  const { t } = useTranslation();

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    enabled: isAuthenticated,
  });

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  useEffect(() => {
    getAudioCacheSize().then(setCacheSize);
    Notifications.getPermissionsAsync().then(({ status }) => setNotifStatus(status));
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPlanLabel = () => {
    const labels: Record<string, string> = {
      free: t('settings.planFree'),
      plus: t('settings.planPlus'),
      family: t('settings.planFamily'),
    };
    return labels[plan] || plan;
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('common.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => clearAuth() },
    ]);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      clearAuth();
    } catch {
      setDeleting(false);
      Alert.alert(t('common.error'), t('settings.deleteAccountError'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={styles.card}>
            {profile?.name && (
              <SettingRow label={t('settings.name', '이름')} value={profile.name} />
            )}
            {profile?.email && (
              <SettingRow label={t('settings.email', '이메일')} value={profile.email} />
            )}
            <SettingRow label={t('settings.plan')} value={getPlanLabel()} />
            <SettingRow label={t('settings.managePlan')} value="→" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <View style={styles.card}>
            <SettingRow
              label={t('settings.notifPermission', '알림 권한')}
              value={notifStatus === 'granted' ? t('settings.permitted', '허용됨') : t('settings.notPermitted', '허용 안 됨')}
              valueColor={notifStatus === 'granted' ? Colors.light.primary : Colors.light.error}
              onPress={async () => {
                if (notifStatus !== 'granted') {
                  const { status } = await Notifications.requestPermissionsAsync();
                  setNotifStatus(status);
                  if (status !== 'granted') {
                    Linking.openSettings();
                  }
                }
              }}
            />
            <SettingRow
              label={t('settings.alarmNotif')}
              trailing={<Switch value={true} trackColor={{ true: Colors.light.primary }} />}
            />
            <SettingRow
              label={t('settings.messageNotif')}
              trailing={<Switch value={true} trackColor={{ true: Colors.light.primary }} />}
            />
            <View style={settingStyles.row}>
              <Text style={settingStyles.label}>{t('settings.defaultSnooze')}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[5, 10, 15].map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setDefaultSnoozeMinutes(m)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: defaultSnoozeMinutes === m ? Colors.light.primary : Colors.light.surfaceVariant,
                    }}
                  >
                    <Text style={{
                      fontSize: FontSize.sm,
                      fontWeight: '600',
                      color: defaultSnoozeMinutes === m ? '#FFF' : Colors.light.textSecondary,
                    }}>
                      {m}{t('settings.minutes')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.voice')}</Text>
          <View style={styles.card}>
            <SettingRow
              label={t('settings.voiceQuality')}
              value={t('settings.voiceQualityHigh')}
              onPress={() => {}}
            />
            <SettingRow label={t('settings.cacheSize')} value={formatBytes(cacheSize)} />
            <SettingRow
              label={t('settings.clearCache')}
              valueColor={Colors.light.error}
              value={t('common.delete')}
              onPress={() => Alert.alert(t('settings.clearCache'), t('settings.clearCacheConfirm'))}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.app')}</Text>
          <View style={styles.card}>
            <SettingRow
              label={t('settings.darkMode')}
              trailing={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ true: Colors.light.primary }}
                />
              }
            />
            <SettingRow
              label={t('settings.language')}
              value={t('settings.languageKorean')}
              onPress={() => {}}
            />
            <SettingRow label={t('settings.version')} value={appVersion} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.info')}</Text>
          <View style={styles.card}>
            <SettingRow label={t('settings.terms')} value="→" onPress={() => {}} />
            <SettingRow label={t('settings.privacy')} value="→" onPress={() => {}} />
            <SettingRow label={t('settings.openSource')} value="→" onPress={() => {}} />
          </View>
        </View>

        {isAuthenticated && (
          <>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>{t('common.logout')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={() => setShowDeleteDialog(true)}
            >
              <Text style={styles.deleteAccountText}>{t('settings.deleteAccount')}</Text>
            </TouchableOpacity>
          </>
        )}

        {showDeleteDialog && (
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteDialogTitle}>{t('settings.deleteAccount')}</Text>
            <Text style={styles.deleteDialogWarning}>{t('settings.deleteAccountWarning')}</Text>
            <Text style={styles.deleteDialogPrompt}>{t('settings.deleteAccountConfirmPrompt')}</Text>
            <TextInput
              style={styles.deleteDialogInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!deleting}
            />
            <View style={styles.deleteDialogButtons}>
              <TouchableOpacity
                style={styles.deleteDialogCancel}
                onPress={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
              >
                <Text style={styles.deleteDialogCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteDialogConfirm,
                  deleteConfirmText !== t('settings.deleteAccountConfirmWord') && styles.disabled,
                ]}
                onPress={handleDeleteAccount}
                disabled={deleteConfirmText !== t('settings.deleteAccountConfirmWord') || deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.deleteDialogConfirmText}>{t('settings.deleteAccount')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  value,
  valueColor,
  trailing,
  onPress,
}: {
  label: string;
  value?: string;
  valueColor?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={settingStyles.row} onPress={onPress}>
      <Text style={settingStyles.label}>{label}</Text>
      {trailing || (
        <Text style={[settingStyles.value, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
      )}
    </Wrapper>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  value: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  logoutText: {
    fontSize: FontSize.md,
    color: Colors.light.error,
    fontWeight: '600',
  },
  deleteAccountButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  deleteAccountText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  deleteDialog: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  deleteDialogTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.error,
    marginBottom: Spacing.sm,
  },
  deleteDialogWarning: {
    fontSize: FontSize.sm,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  deleteDialogPrompt: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  deleteDialogInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  deleteDialogButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deleteDialogCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceVariant,
  },
  deleteDialogCancelText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    fontWeight: '600',
  },
  deleteDialogConfirm: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.error,
  },
  deleteDialogConfirmText: {
    fontSize: FontSize.md,
    color: '#FFF',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
