import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { PRESET_CATEGORIES } from '../../src/constants/presets';
import { getVoiceProfiles, generateTTS, getFriendList, sendGift } from '../../src/services/api';
import { saveAudioLocally, playAudio } from '../../src/services/audio';
import { useAppStore } from '../../src/stores/useAppStore';
import type { VoiceProfile, Friend, AxiosApiError } from '../../src/types';

export default function CreateMessageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, incrementTtsCount } = useAppStore();

  const [tab, setTab] = useState<'preset' | 'custom'>('preset');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [generatedAudioId, setGeneratedAudioId] = useState<string | null>(null);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  const { data: voiceProfiles } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: isAuthenticated,
  });

  const readyProfiles = voiceProfiles?.filter((p: VoiceProfile) => p.status === 'ready') ?? [];

  const ttsMutation = useMutation({
    mutationFn: generateTTS,
    onSuccess: async (data) => {
      // base64 오디오를 로컬에 저장
      const localPath = await saveAudioLocally(data.audio_base64, data.message_id, data.audio_format);
      setGeneratedAudioId(data.message_id);
      incrementTtsCount();

      // 자동 재생
      const sound = await playAudio(localPath);
      setCurrentSound(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setCurrentSound(null);
        }
      });

      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
    onError: (err: AxiosApiError) => {
      Alert.alert('TTS 생성 실패', err.response?.data?.error || '다시 시도해주세요.');
    },
  });

  const messageText = tab === 'preset' ? selectedPreset : customText;

  const handleGenerate = () => {
    if (!selectedVoiceId) {
      Alert.alert('음성 선택', '음성 프로필을 선택해주세요.');
      return;
    }
    if (!messageText?.trim()) {
      Alert.alert('메시지 입력', '메시지를 입력하거나 프리셋을 선택해주세요.');
      return;
    }

    ttsMutation.mutate({
      voice_profile_id: selectedVoiceId,
      text: messageText.trim(),
      category: selectedCategory ?? 'custom',
    });
  };

  const handlePreview = async () => {
    if (!generatedAudioId) return;

    if (currentSound) {
      await currentSound.unloadAsync();
      setCurrentSound(null);
      return;
    }

    const { saveAudioLocally: _, getLocalAudioPath } = await import('../../src/services/audio');
    const path = getLocalAudioPath(generatedAudioId);
    const sound = await playAudio(path);
    setCurrentSound(sound);
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        setCurrentSound(null);
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 음성 프로필 선택 */}
      <Text style={styles.sectionTitle}>누구의 목소리로?</Text>
      {readyProfiles.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyVoice}
          onPress={() => router.push('/voice/record')}
        >
          <Text style={styles.emptyVoiceText}>
            먼저 음성을 등록해주세요 →
          </Text>
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voiceRow}>
          {readyProfiles.map((profile: VoiceProfile) => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.voiceChip,
                selectedVoiceId === profile.id && styles.voiceChipSelected,
              ]}
              onPress={() => setSelectedVoiceId(profile.id)}
            >
              <Text style={styles.voiceChipAvatar}>{profile.name.charAt(0)}</Text>
              <Text
                style={[
                  styles.voiceChipName,
                  selectedVoiceId === profile.id && styles.voiceChipNameSelected,
                ]}
              >
                {profile.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 탭 선택 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'preset' && styles.tabActive]}
          onPress={() => setTab('preset')}
        >
          <Text style={[styles.tabText, tab === 'preset' && styles.tabTextActive]}>
            프리셋 메시지
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'custom' && styles.tabActive]}
          onPress={() => setTab('custom')}
        >
          <Text style={[styles.tabText, tab === 'custom' && styles.tabTextActive]}>
            직접 입력
          </Text>
        </TouchableOpacity>
      </View>

      {/* 프리셋 */}
      {tab === 'preset' && (
        <>
          {/* 카테고리 선택 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            {PRESET_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.key && styles.categoryChipActive,
                ]}
                onPress={() => {
                  setSelectedCategory(cat.key);
                  setSelectedPreset(null);
                }}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.key && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 메시지 선택 */}
          {selectedCategory && (
            <View style={styles.presetList}>
              {PRESET_CATEGORIES.find((c) => c.key === selectedCategory)?.messages.map(
                (msg, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.presetItem,
                      selectedPreset === msg && styles.presetItemSelected,
                    ]}
                    onPress={() => setSelectedPreset(msg)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedPreset === msg && styles.presetTextSelected,
                      ]}
                    >
                      {msg}
                    </Text>
                    {selectedPreset === msg && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </>
      )}

      {/* 커스텀 입력 */}
      {tab === 'custom' && (
        <View style={styles.customSection}>
          <TextInput
            style={styles.customInput}
            placeholder="메시지를 입력해주세요 (최대 200자)"
            value={customText}
            onChangeText={(t) => t.length <= 200 && setCustomText(t)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={Colors.light.textTertiary}
          />
          <Text style={styles.charCount}>{customText.length}/200</Text>
        </View>
      )}

      {/* 생성 버튼 */}
      <TouchableOpacity
        style={[
          styles.generateButton,
          (!messageText || !selectedVoiceId || ttsMutation.isPending) && styles.disabled,
        ]}
        onPress={handleGenerate}
        disabled={!messageText || !selectedVoiceId || ttsMutation.isPending}
      >
        {ttsMutation.isPending ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFF" />
            <Text style={styles.generateText}> 음성 생성 중...</Text>
          </View>
        ) : (
          <Text style={styles.generateText}>🔊 음성 메시지 생성</Text>
        )}
      </TouchableOpacity>

      {/* 생성 결과 */}
      {generatedAudioId && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>✅ 음성 메시지 생성 완료!</Text>
          <Text style={styles.resultMessage}>"{messageText}"</Text>
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
              <Text style={styles.previewText}>
                {currentSound ? '⏸️ 정지' : '▶️ 미리듣기'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.useButton}
              onPress={() => {
                Alert.alert('저장 완료', '이 메시지로 알람을 설정하시겠어요?', [
                  { text: '나중에', style: 'cancel' },
                  {
                    text: '알람 설정',
                    onPress: () => router.push('/alarm/create'),
                  },
                ]);
              }}
            >
              <Text style={styles.useText}>⏰ 알람에 사용</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.giftButton}
            onPress={async () => {
              try {
                const friends = await getFriendList();
                if (!friends || friends.length === 0) {
                  Alert.alert('친구 없음', '먼저 친구를 추가해주세요.');
                  return;
                }
                const buttons = friends.slice(0, 5).map((f: Friend) => ({
                  text: f.friend_name || f.friend_email || '?',
                  onPress: async () => {
                    try {
                      await sendGift({
                        recipient_email: f.friend_email ?? '',
                        message_id: generatedAudioId!,
                        note: messageText ?? undefined,
                      });
                      Alert.alert('전송 완료', `${f.friend_name || f.friend_email}님에게 선물을 보냈습니다!`);
                    } catch (err: unknown) {
                      const apiErr = err as AxiosApiError;
                      Alert.alert('오류', apiErr.response?.data?.error || '선물 전송에 실패했습니다.');
                    }
                  },
                }));
                buttons.push({ text: '취소', onPress: () => {} });
                Alert.alert('선물하기', '누구에게 보낼까요?', buttons);
              } catch {
                Alert.alert('오류', '친구 목록을 불러올 수 없습니다.');
              }
            }}
          >
            <Text style={styles.giftText}>🎁 친구에게 선물하기</Text>
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  emptyVoice: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyVoiceText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  voiceRow: {
    marginBottom: Spacing.lg,
  },
  voiceChip: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  voiceChipSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surfaceVariant,
  },
  voiceChipAvatar: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  voiceChipName: {
    fontSize: FontSize.sm,
    color: Colors.light.text,
    fontWeight: '600',
  },
  voiceChipNameSelected: {
    color: Colors.light.primary,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  categoryRow: {
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    color: Colors.light.text,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: '#FFF',
  },
  presetList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  presetItemSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surfaceVariant,
  },
  presetText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  presetTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: FontSize.lg,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  customSection: {
    marginBottom: Spacing.lg,
  },
  customInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginTop: Spacing.xs,
  },
  generateButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.success + '40',
  },
  resultTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.success,
    marginBottom: Spacing.sm,
  },
  resultMessage: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  previewButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  previewText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  useButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  useText: {
    color: '#FFF',
    fontWeight: '600',
  },
  giftButton: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.accent,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  giftText: {
    color: Colors.light.accent,
    fontWeight: '600',
    fontSize: FontSize.md,
  },
});
