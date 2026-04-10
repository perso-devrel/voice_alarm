import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../src/constants/theme';
import { playAudio, getLocalAudioPath } from '../src/services/audio';
import { useAppStore } from '../src/stores/useAppStore';
import { generateWaveform, formatTime } from '../src/utils/waveform';

const WAVEFORM_BAR_COUNT = 48;
const WAVEFORM_BAR_WIDTH = 3;
const WAVEFORM_BAR_GAP = 2;
const WAVEFORM_HEIGHT = 56;
const WAVEFORM_TOTAL_WIDTH = WAVEFORM_BAR_COUNT * (WAVEFORM_BAR_WIDTH + WAVEFORM_BAR_GAP);
const ACTIVE_PULSE_RANGE = 3;

function WaveformBar({
  height,
  played,
  isNearPlayhead,
  isPlaying,
}: {
  height: number;
  played: boolean;
  isNearPlayhead: boolean;
  isPlaying: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying && isNearPlayhead) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }
    pulseAnim.setValue(1);
  }, [isPlaying, isNearPlayhead, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        {
          height: height * WAVEFORM_HEIGHT,
          backgroundColor: played ? Colors.light.primary : Colors.light.primaryLight,
          transform: [{ scaleY: pulseAnim }],
        },
      ]}
    />
  );
}

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
  const [progress, setProgress] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const waveformWidth = useRef(WAVEFORM_TOTAL_WIDTH);
  const progressRef = useRef(0);
  const durationRef = useRef(0);
  const playheadAnim = useRef(new Animated.Value(0)).current;

  const waveformBars = useMemo(
    () => generateWaveform(params.messageId || 'default', WAVEFORM_BAR_COUNT),
    [params.messageId],
  );

  const activeBarIndex = Math.floor(progress * WAVEFORM_BAR_COUNT);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    if (!isSeeking) {
      playheadAnim.setValue(progress);
    }
  }, [progress, isSeeking, playheadAnim]);

  const seekToPosition = useCallback(
    async (x: number) => {
      const w = waveformWidth.current;
      const clamped = Math.max(0, Math.min(x, w));
      const seekProgress = clamped / w;
      const dur = durationRef.current;
      setProgress(seekProgress);
      setPositionMs(seekProgress * dur);
      playheadAnim.setValue(seekProgress);
      if (soundRef.current && dur > 0) {
        await soundRef.current.setPositionAsync(seekProgress * dur);
      }
    },
    [playheadAnim],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsSeeking(true);
          seekToPosition(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          seekToPosition(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          setIsSeeking(false);
        },
      }),
    [seekToPosition],
  );

  const onPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.durationMillis && status.durationMillis > 0) {
        setDurationMs(status.durationMillis);
        if (!isSeeking) {
          setPositionMs(status.positionMillis);
          setProgress(status.positionMillis / status.durationMillis);
        }
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaying(null);
        setProgress(1);
      }
    },
    [setPlaying, isSeeking],
  );

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
      soundRef.current?.unloadAsync();
    };
  }, []);

  const handlePlay = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (progress >= 1) {
          await sound.setPositionAsync(0);
          setProgress(0);
        }
        await sound.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    const localPath = getLocalAudioPath(params.messageId);
    const newSound = await playAudio(localPath);
    setSound(newSound);
    soundRef.current = newSound;
    setIsPlaying(true);
    setPlaying(params.messageId);
    newSound.setOnPlaybackStatusUpdate(onPlaybackStatus);
  };

  const handleClose = async () => {
    if (sound) {
      await sound.unloadAsync();
    }
    setPlaying(null);
    router.back();
  };

  const onWaveformLayout = (e: LayoutChangeEvent) => {
    waveformWidth.current = e.nativeEvent.layout.width;
  };

  const playheadLeft = playheadAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, WAVEFORM_TOTAL_WIDTH],
  });

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.categoryEmoji}>{getEmoji()}</Text>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{params.voiceName?.charAt(0) || '?'}</Text>
          </View>
          <Text style={styles.voiceName}>{params.voiceName}</Text>
        </View>

        <Text style={styles.messageText}>"{params.text}"</Text>

        <View style={styles.waveformContainer}>
          <View
            style={styles.waveformBars}
            onLayout={onWaveformLayout}
            {...panResponder.panHandlers}
          >
            {waveformBars.map((height, i) => {
              const played = i / WAVEFORM_BAR_COUNT < progress;
              const distance = Math.abs(i - activeBarIndex);
              const isNearPlayhead = distance <= ACTIVE_PULSE_RANGE;
              return (
                <View key={i} style={styles.waveformBarTouch}>
                  <WaveformBar
                    height={height}
                    played={played}
                    isNearPlayhead={isNearPlayhead}
                    isPlaying={isPlaying}
                  />
                </View>
              );
            })}
            <Animated.View
              style={[
                styles.playhead,
                { transform: [{ translateX: playheadLeft }] },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
            <Text style={styles.timeText}>
              {durationMs > 0 ? formatTime(durationMs) : '--:--'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

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
  waveformContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WAVEFORM_HEIGHT,
    position: 'relative',
  },
  waveformBarTouch: {
    width: WAVEFORM_BAR_WIDTH + WAVEFORM_BAR_GAP,
    height: WAVEFORM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformBar: {
    width: WAVEFORM_BAR_WIDTH,
    borderRadius: WAVEFORM_BAR_WIDTH / 2,
  },
  playhead: {
    position: 'absolute',
    left: 0,
    top: -2,
    width: 2,
    height: WAVEFORM_HEIGHT + 4,
    backgroundColor: Colors.light.primaryDark,
    borderRadius: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    fontVariant: ['tabular-nums'],
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
