import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize } from '../src/constants/theme';
import { useAppStore } from '../src/stores/useAppStore';

const { width } = Dimensions.get('window');

const ONBOARDING_PAGES = [
  {
    emoji: '🎙️',
    title: '누구의 목소리를\n듣고 싶나요?',
    description:
      '엄마, 아빠, 연인, 친구...\n소중한 사람의 목소리를 등록해보세요.\n짧은 녹음이나 통화 녹음만 있으면 돼요.',
    color: '#FFF5F3',
  },
  {
    emoji: '💌',
    title: '매일 따뜻한\n메시지가 찾아와요',
    description:
      '"점심 잘 챙겨 먹어"\n"오늘도 고생 많았어"\n그 사람의 목소리로 응원을 받아보세요.',
    color: '#FFF0ED',
  },
  {
    emoji: '⏰',
    title: '소중한 목소리로\n하루를 시작하세요',
    description:
      '알람부터 퇴근 알림까지,\n하루 종일 소중한 사람의 목소리와 함께.\n지금 바로 시작해볼까요?',
    color: '#FFEAE5',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const renderPage = ({ item, index }: { item: typeof ONBOARDING_PAGES[0]; index: number }) => (
    <View style={[styles.page, { width, backgroundColor: item.color }]}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const isLastPage = currentIndex === ONBOARDING_PAGES.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_PAGES}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(_, i) => i.toString()}
      />

      {/* 인디케이터 */}
      <View style={styles.indicatorRow}>
        {ONBOARDING_PAGES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
              ]}
            />
          );
        })}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextText}>
          {isLastPage ? '시작하기' : '다음'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: FontSize.lg,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    marginHorizontal: Spacing.xl,
    marginBottom: 50,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#FFF',
  },
});
