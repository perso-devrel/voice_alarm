import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { playAudio, getLocalAudioPath, isAudioCached } from '../services/audio';
import { generateWaveform, formatTime } from '../utils/waveform';

const BAR_COUNT = 24;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const BAR_HEIGHT = 28;

interface Props {
  messageId: string;
  isActive: boolean;
  onPlay: (messageId: string, sound: Audio.Sound) => void;
  onStop: () => void;
}

export function MiniWaveformPlayer({ messageId, isActive, onPlay, onStop }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const bars = useMemo(() => generateWaveform(messageId, BAR_COUNT), [messageId]);

  useEffect(() => {
    if (!isActive && sound) {
      sound.unloadAsync();
      setSound(null);
      soundRef.current = null;
      setIsPlaying(false);
      setProgress(0);
      setPositionMs(0);
      setDurationMs(0);
    }
  }, [isActive, sound]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const onPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.durationMillis && status.durationMillis > 0) {
        setDurationMs(status.durationMillis);
        setPositionMs(status.positionMillis);
        setProgress(status.positionMillis / status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(1);
        onStop();
      }
    },
    [onStop],
  );

  const handleToggle = async () => {
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

    const cached = await isAudioCached(messageId);
    if (!cached) return;

    const localPath = getLocalAudioPath(messageId);
    const newSound = await playAudio(localPath);
    setSound(newSound);
    soundRef.current = newSound;
    setIsPlaying(true);
    newSound.setOnPlaybackStatusUpdate(onPlaybackStatus);
    onPlay(messageId, newSound);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleToggle} style={styles.playBtn} hitSlop={8}>
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
      </TouchableOpacity>
      <View style={styles.waveformArea}>
        <View style={styles.barsRow}>
          {bars.map((h, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: h * BAR_HEIGHT,
                  backgroundColor:
                    i / BAR_COUNT < progress
                      ? Colors.light.primary
                      : Colors.light.primaryLight,
                },
              ]}
            />
          ))}
        </View>
        {isActive && (
          <Text style={styles.time}>
            {formatTime(positionMs)}
            {durationMs > 0 ? ` / ${formatTime(durationMs)}` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 12,
  },
  waveformArea: {
    alignItems: 'flex-start',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
