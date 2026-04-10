import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppStore } from '../src/stores/useAppStore';
import { setupAudioSession, ensureAudioDir } from '../src/services/audio';

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

  useEffect(() => {
    loadPersistedState();
    setupAudioSession();
    ensureAudioDir();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
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
            name="voice/record"
            options={{ headerShown: true, title: '음성 녹음', presentation: 'modal' }}
          />
          <Stack.Screen
            name="voice/upload"
            options={{ headerShown: true, title: '파일 업로드', presentation: 'modal' }}
          />
          <Stack.Screen
            name="voice/diarize"
            options={{ headerShown: true, title: '화자 분리', presentation: 'modal' }}
          />
          <Stack.Screen
            name="alarm/create"
            options={{ headerShown: true, title: '알람 설정', presentation: 'modal' }}
          />
          <Stack.Screen
            name="message/create"
            options={{ headerShown: true, title: '메시지 작성', presentation: 'modal' }}
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
