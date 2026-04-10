import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useAppStore } from '../../src/stores/useAppStore';
import { useState, useEffect } from 'react';
import { getAudioCacheSize } from '../../src/services/audio';

export default function SettingsScreen() {
  const { plan, isAuthenticated, clearAuth } = useAppStore();
  const [cacheSize, setCacheSize] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

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
      free: 'Free',
      plus: 'Plus ($3.99/월)',
      family: 'Family ($7.99/월)',
    };
    return labels[plan] || plan;
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => clearAuth() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>설정</Text>

        {/* 계정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.card}>
            <SettingRow label="구독 플랜" value={getPlanLabel()} />
            <SettingRow label="구독 관리" value="→" onPress={() => {}} />
          </View>
        </View>

        {/* 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림</Text>
          <View style={styles.card}>
            <SettingRow
              label="알람 알림"
              trailing={<Switch value={true} trackColor={{ true: Colors.light.primary }} />}
            />
            <SettingRow
              label="응원 메시지 알림"
              trailing={<Switch value={true} trackColor={{ true: Colors.light.primary }} />}
            />
          </View>
        </View>

        {/* 음성 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>음성</Text>
          <View style={styles.card}>
            <SettingRow label="음성 품질" value="높음" onPress={() => {}} />
            <SettingRow label="캐시 크기" value={formatBytes(cacheSize)} />
            <SettingRow
              label="캐시 삭제"
              valueColor={Colors.light.error}
              value="삭제"
              onPress={() => Alert.alert('캐시 삭제', '모든 캐시된 오디오를 삭제하시겠어요?')}
            />
          </View>
        </View>

        {/* 앱 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱</Text>
          <View style={styles.card}>
            <SettingRow
              label="다크 모드"
              trailing={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ true: Colors.light.primary }}
                />
              }
            />
            <SettingRow label="언어" value="한국어" onPress={() => {}} />
            <SettingRow label="버전" value="1.0.0" />
          </View>
        </View>

        {/* 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>
          <View style={styles.card}>
            <SettingRow label="이용약관" value="→" onPress={() => {}} />
            <SettingRow label="개인정보처리방침" value="→" onPress={() => {}} />
            <SettingRow label="오픈소스 라이선스" value="→" onPress={() => {}} />
          </View>
        </View>

        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
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
