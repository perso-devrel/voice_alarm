import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../src/constants/theme';
import { playAudio, getLocalAudioPath } from '../src/services/audio';
import { useAppStore } from '../src/stores/useAppStore';

const { width: _width } = Dimensions.get('window');

export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    messageId: string;
    text: string;
    voiceName: string;
    category: string;
  }>();

  const { t } = useTranslation();
  const { setPlaying } = useAppStore();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reacted, setReacted] = useState(false);

  const getBackgroundColor = () => {
    const map: Record<string, string[]> = {
      morning: ['#FFF5E6', '#FFE4C4'],
      lunch: ['#FFF0E6', '#FFD9C4'],
      afternoon: ['#F5F0FF', '#E4D9FF'],
      evening: ['#FFE8E0', '#FFC4B3'],
      night: ['#E8E0FF', '#C4B3FF'],
    };
    return map[params.category]?.[0] || Colors.light.background;
  };

  const getEmoji = () => {
    const map: Record<string, string> = {
      morning: '🌅',
      lunch: '🍽️',
      afternoon: '☕',
      evening: '🌆',
      night: '🌙',
    };
    return map[params.category] || '💌';
  };

  useEffect(() => {
    handlePlay();
    return () => {
      sound?.unloadAsync();
    };
  }, []);

  const handlePlay = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    const localPath = getLocalAudioPath(params.messageId);
    const newSound = await playAudio(localPath);
    setSound(newSound);
    setIsPlaying(true);
    setPlaying(params.messageId);

    newSound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        setIsPlaying(false);
        setPlaying(null);
      }
    });
  };

  const handleClose = async () => {
    if (sound) {
      await sound.unloadAsync();
    }
    setPlaying(null);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* 아이콘 */}
        <Text style={styles.categoryEmoji}>{getEmoji()}</Text>

        {/* 프로필 */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{params.voiceName?.charAt(0) || '?'}</Text>
          </View>
          <Text style={styles.voiceName}>{params.voiceName}</Text>
        </View>

        {/* 메시지 */}
        <Text style={styles.messageText}>"{params.text}"</Text>

        {/* 재생 컨트롤 */}
        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

        {/* 반응 */}
        {!reacted ? (
          <TouchableOpacity style={styles.reactionButton} onPress={() => setReacted(true)}>
            <Text style={styles.reactionText}>{t('player.thanks')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.reactedText}>{t('player.thanked')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  categoryEmoji: {
    fontSize: 64,
    marginBottom: Spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  voiceName: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.light.text,
  },
  messageText: {
    fontSize: FontSize.xxl,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: Spacing.xxl,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  playIcon: {
    fontSize: 28,
  },
  reactionButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  reactionText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: '#FFF',
  },
  reactedText: {
    fontSize: FontSize.md,
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
