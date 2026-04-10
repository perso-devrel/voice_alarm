import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useGoogleAuth, signInWithApple, isAppleAuthAvailable, saveAuthToken, decodeIdToken } from '../services/auth';
import { useAppStore } from '../stores/useAppStore';

export default function LoginButtons() {
  const { setAuth } = useAppStore();
  const { request, response, promptAsync } = useGoogleAuth();

  // Google 로그인 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        handleLoginSuccess(idToken, 'google');
      }
    }
  }, [response]);

  const handleLoginSuccess = async (idToken: string, provider: 'google' | 'apple') => {
    await saveAuthToken(idToken, provider);
    const user = decodeIdToken(idToken);
    if (user) {
      setAuth(idToken, user.sub);
    }
  };

  const handleAppleLogin = async () => {
    const result = await signInWithApple();
    if (result) {
      await handleLoginSuccess(result.idToken, 'apple');
    }
  };

  return (
    <View style={styles.container}>
      {/* Google 로그인 */}
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.googleText}>Google로 계속하기</Text>
      </TouchableOpacity>

      {/* Apple 로그인 (iOS만) */}
      {isAppleAuthAvailable() && (
        <TouchableOpacity style={styles.appleButton} onPress={handleAppleLogin}>
          <Text style={styles.appleIcon}></Text>
          <Text style={styles.appleText}>Apple로 계속하기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#DADCE0',
    gap: Spacing.sm,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: '#3C4043',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  appleText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
