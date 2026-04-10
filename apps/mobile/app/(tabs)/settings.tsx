import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useAppStore } from '../../src/stores/useAppStore';
import { useState, useEffect } from 'react';
import { getAudioCacheSize } from '../../src/services/audio';

export default function SettingsScreen() {
  const { plan, isAuthenticated, clearAuth } = useAppStore();
  const [cacheSize, setCacheSize] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    getAudioCacheSize().then(setCacheSize);
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

  const handleLogout = () => {
    Alert.alert(t('common.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => clearAuth() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={styles.card}>
            <SettingRow label={t('settings.plan')} value={getPlanLabel()} />
            <SettingRow label={t('settings.managePlan')} value="→" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <View style={styles.card}>
            <SettingRow
              label={t('settings.alarmNotif')}
              trailing={<Switch value={true} trackColor={{ true: Colors.light.primary }} />}
            />
            <SettingRow
              label={t('settings.messageNotif')}
              trailing={<Switch value={true} trackColor={{ true: Colors.light.primary }} />}
            />
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
            <SettingRow label={t('settings.version')} value="1.0.0" />
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
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('common.logout')}</Text>
          </TouchableOpacity>
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
});
