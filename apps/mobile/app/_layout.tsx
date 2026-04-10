import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import type * as Notifications from 'expo-notifications';
import { useAppStore } from '../src/stores/useAppStore';
import { setupAudioSession, ensureAudioDir } from '../src/services/audio';
import {
  requestNotificationPermissions,
  addNotificationResponseListener,
  scheduleSnoozeNotification,
  SNOOZE_ACTION,
} from '../src/services/notifications';
import { OfflineBanner } from '../src/components/OfflineBanner';
import '../src/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const loadPersistedState = useAppStore((s) => s.loadPersistedState);
  const { t } = useTranslation();
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    loadPersistedState();
    setupAudioSession();
    ensureAudioDir();
    requestNotificationPermissions();

    responseListener.current = addNotificationResponseListener((response) => {
      const actionId = response.actionIdentifier;
      const { content } = response.notification.request;
      const data = content.data;

      if (actionId === SNOOZE_ACTION && data) {
        const minutes = typeof data.snoozeMinutes === 'number' ? data.snoozeMinutes : 5;
        scheduleSnoozeNotification(
          content.title || '⏰ VoiceAlarm',
          content.body || '',
          data as Record<string, unknown>,
          minutes,
        );
        return;
      }

      if (data?.messageId) {
        router.push({
          pathname: '/player',
          params: {
            messageId: String(data.messageId),
            text: String(data.text || ''),
            voiceName: String(data.voiceName || ''),
            category: String(data.category || ''),
          },
        });
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFF5F3' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="voice/[id]"
            options={{ headerShown: true, title: t('screen.voiceDetail') }}
          />
          <Stack.Screen
            name="voice/record"
            options={{ headerShown: true, title: t('screen.voiceRecord'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="voice/upload"
            options={{ headerShown: true, title: t('screen.fileUpload'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="voice/diarize"
            options={{ headerShown: true, title: t('screen.diarize'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="alarm/create"
            options={{ headerShown: true, title: t('screen.alarmSetting'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="alarm/edit"
            options={{ headerShown: true, title: t('alarmEdit.title'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="message/create"
            options={{ headerShown: true, title: t('screen.writeMessage'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="gift/received"
            options={{ headerShown: true, title: t('screen.receivedGifts'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="player"
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
