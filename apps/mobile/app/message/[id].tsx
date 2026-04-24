import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';
import { getMessages } from '../../src/services/api';
import { playAudio, isAudioCached, getLocalAudioPath } from '../../src/services/audio';
import { useAppStore } from '../../src/stores/useAppStore';
import type { Message } from '../../src/types';

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { t } = useTranslation();
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cached, setCached] = useState<boolean | null>(null);

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
    enabled: isAuthenticated,
  });

  const message = messages?.find((m: Message) => m.id === id);

  const checkCache = async () => {
    if (id && cached === null) {
      const exists = await isAudioCached(id);
      setCached(exists);
    }
  };
  checkCache();

  const handlePlayback = async () => {
    if (!id) return;

    if (currentSound) {
      await currentSound.unloadAsync();
      setCurrentSound(null);
      setIsPlaying(false);
      return;
    }

    const path = getLocalAudioPath(id);
    const sound = await playAudio(path);
    setCurrentSound(sound);
    setIsPlaying(true);
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        setCurrentSound(null);
        setIsPlaying(false);
      }
    });
  };

  if (!message) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('messageDetail.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{message.category.toUpperCase()}</Text>
          <Text style={styles.date}>
            {new Date(message.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {message.voice_name && (
          <TouchableOpacity
            style={styles.voiceBadge}
            onPress={() => router.push(`/voice/${message.voice_profile_id}`)}
          >
            <View style={styles.voiceAvatar}>
              <Text style={styles.voiceAvatarText}>{message.voice_name.charAt(0)}</Text>
            </View>
            <Text style={styles.voiceName}>{message.voice_name}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.textBox}>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>

        <View style={styles.actions}>
          {cached && (
            <TouchableOpacity style={styles.playButton} onPress={handlePlayback}>
              <Text style={styles.playButtonText}>
                {isPlaying ? t('messageDetail.stop') : t('messageDetail.play')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.alarmButton}
            onPress={() => router.push(`/alarm/create?message_id=${id}`)}
          >
            <Text style={styles.alarmButtonText}>{t('messageDetail.useForAlarm')}</Text>
          </TouchableOpacity>

          {cached && (
            <TouchableOpacity
              style={styles.translateButton}
              onPress={() => router.push(`/dub/translate?message_id=${id}`)}
            >
              <Text style={styles.translateButtonText}>{t('messageDetail.translate')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.giftButton}
            onPress={() => router.push(`/message/create?voice_id=${message.voice_profile_id}`)}
          >
            <Text style={styles.giftButtonText}>{t('messageDetail.createAnother')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  category: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.light.textTertiary,
  },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  voiceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceAvatarText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.light.primaryDark,
  },
  voiceName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: Colors.light.primary,
  },
  textBox: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    minHeight: 120,
  },
  messageText: {
    fontSize: FontSize.lg,
    color: Colors.light.text,
    lineHeight: 28,
  },
  actions: {
    gap: Spacing.sm,
  },
  playButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
  alarmButton: {
    backgroundColor: Colors.light.surfaceVariant,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  alarmButtonText: {
    color: Colors.light.primary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
  translateButton: {
    backgroundColor: Colors.light.surfaceVariant,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.textTertiary,
  },
  translateButtonText: {
    color: Colors.light.textSecondary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
  giftButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  giftButtonText: {
    color: Colors.light.textSecondary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
});
