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
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { PRESET_CATEGORIES } from '../../src/constants/presets';
import { getVoiceProfiles, generateTTS, getFriendList, sendGift } from '../../src/services/api';
import { saveAudioLocally, playAudio } from '../../src/services/audio';
import { useAppStore } from '../../src/stores/useAppStore';
import type { VoiceProfile, Friend } from '../../src/types';
import { getApiErrorMessage } from '../../src/types';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';

export default function CreateMessageScreen() {
  const router = useRouter();
  const { voice_id } = useLocalSearchParams<{ voice_id?: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated, incrementTtsCount } = useAppStore();
  const { t } = useTranslation();

  const [tab, setTab] = useState<'preset' | 'custom'>('preset');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(voice_id ?? null);
  const [generatedAudioId, setGeneratedAudioId] = useState<string | null>(null);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [giftFriends, setGiftFriends] = useState<Friend[]>([]);
  const [giftNote, setGiftNote] = useState('');
  const [giftSending, setGiftSending] = useState(false);
  const toast = useToast();

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
      const localPath = await saveAudioLocally(
        data.audio_base64,
        data.message_id,
        data.audio_format,
      );
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
    onError: (err: unknown) => {
      Alert.alert(
        t('messageCreate.generateErrorTitle'),
        getApiErrorMessage(err, t('messageCreate.generateError')),
      );
    },
  });

  const messageText = tab === 'preset' ? selectedPreset : customText;

  const handleGenerate = () => {
    if (!selectedVoiceId) {
      Alert.alert(t('messageCreate.selectVoiceTitle'), t('messageCreate.selectVoice'));
      return;
    }
    if (!messageText?.trim()) {
      Alert.alert(t('messageCreate.enterMessageTitle'), t('messageCreate.enterMessage'));
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
      <Text style={styles.sectionTitle}>{t('messageCreate.whoseVoice')}</Text>
      {readyProfiles.length === 0 ? (
        <TouchableOpacity style={styles.emptyVoice} onPress={() => router.push('/voice/record')}>
          <Text style={styles.emptyVoiceText}>{t('messageCreate.emptyVoice')}</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voiceRow}>
          {readyProfiles.map((profile: VoiceProfile) => (
            <TouchableOpacity
              key={profile.id}
              style={[styles.voiceChip, selectedVoiceId === profile.id && styles.voiceChipSelected]}
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
            {t('messageCreate.presetTab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'custom' && styles.tabActive]}
          onPress={() => setTab('custom')}
        >
          <Text style={[styles.tabText, tab === 'custom' && styles.tabTextActive]}>
            {t('messageCreate.customTab')}
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
              {PRESET_CATEGORIES.find((c) => c.key === selectedCategory)?.messages.map((msg, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.presetItem, selectedPreset === msg && styles.presetItemSelected]}
                  onPress={() => setSelectedPreset(msg)}
                >
                  <Text
                    style={[styles.presetText, selectedPreset === msg && styles.presetTextSelected]}
                  >
                    {msg}
                  </Text>
                  {selectedPreset === msg && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {/* 커스텀 입력 */}
      {tab === 'custom' && (
        <View style={styles.customSection}>
          <TextInput
            style={styles.customInput}
            placeholder={t('messageCreate.customPlaceholder')}
            value={customText}
            onChangeText={(v) => v.length <= 200 && setCustomText(v)}
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
            <Text style={styles.generateText}>{t('messageCreate.generating')}</Text>
          </View>
        ) : (
          <Text style={styles.generateText}>{t('messageCreate.generate')}</Text>
        )}
      </TouchableOpacity>

      {/* 생성 결과 */}
      {generatedAudioId && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{t('messageCreate.resultTitle')}</Text>
          <Text style={styles.resultMessage}>"{messageText}"</Text>
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
              <Text style={styles.previewText}>
                {currentSound ? t('messageCreate.stop') : t('messageCreate.preview')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.useButton}
              onPress={() => router.push(`/alarm/create?message_id=${generatedAudioId}`)}
            >
              <Text style={styles.useText}>{t('messageCreate.useForAlarm')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.giftButton}
            onPress={async () => {
              try {
                const friends = await getFriendList();
                if (!friends || friends.length === 0) {
                  Alert.alert(t('messageCreate.noFriendsTitle'), t('messageCreate.noFriends'));
                  return;
                }
                setGiftFriends(friends);
                setGiftNote('');
                setGiftModalVisible(true);
              } catch {
                Alert.alert(t('common.error'), t('messageCreate.friendListError'));
              }
            }}
          >
            <Text style={styles.giftText}>{t('messageCreate.gift')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal
        visible={giftModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGiftModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('messageCreate.giftTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('messageCreate.giftWho')}</Text>
            <TextInput
              style={styles.giftNoteInput}
              placeholder={t('messageCreate.giftNotePlaceholder')}
              placeholderTextColor={Colors.light.textTertiary}
              value={giftNote}
              onChangeText={(v) => v.length <= 200 && setGiftNote(v)}
              maxLength={200}
            />
            <ScrollView style={styles.friendList}>
              {giftFriends.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={styles.friendItem}
                  disabled={giftSending}
                  onPress={async () => {
                    setGiftSending(true);
                    try {
                      await sendGift({
                        recipient_email: f.friend_email ?? '',
                        message_id: generatedAudioId!,
                        note: giftNote.trim() || undefined,
                      });
                      setGiftModalVisible(false);
                      toast.show(t('messageCreate.giftSent', { name: f.friend_name || f.friend_email }));
                    } catch (err: unknown) {
                      Alert.alert(
                        t('common.error'),
                        getApiErrorMessage(err, t('messageCreate.giftError')),
                      );
                    } finally {
                      setGiftSending(false);
                    }
                  }}
                >
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {(f.friend_name || f.friend_email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{f.friend_name || t('common.noName')}</Text>
                    <Text style={styles.friendEmail}>{f.friend_email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setGiftModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  giftNoteInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
  },
  friendList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.sm,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  friendInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  friendName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  friendEmail: {
    fontSize: FontSize.sm,
    color: Colors.light.textTertiary,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalCancelText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
});
