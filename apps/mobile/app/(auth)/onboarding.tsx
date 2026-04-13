import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { TButton } from '../../src/components/common';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  titleKey: string;
  subtitleKey: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🏆',
    titleKey: 'onboarding.slide1Title',
    subtitleKey: 'onboarding.slide1Subtitle',
  },
  {
    id: '2',
    emoji: '🎾',
    titleKey: 'onboarding.slide2Title',
    subtitleKey: 'onboarding.slide2Subtitle',
  },
  {
    id: '3',
    emoji: '👥',
    titleKey: 'onboarding.slide3Title',
    subtitleKey: 'onboarding.slide3Subtitle',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {t(item.titleKey)}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t(item.subtitleKey)}
      </Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
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
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: (colors.primary as string),
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: (colors.primary as string) }]}>TURNEO</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {renderDots()}

      <View style={styles.buttons}>
        <TButton
          title={t('auth.register')}
          onPress={() => router.push('/(auth)/register')}
          variant="primary"
          size="lg"
        />
        <View style={styles.spacer} />
        <TButton
          title={t('auth.login')}
          onPress={() => router.push('/(auth)/login')}
          variant="outline"
          size="lg"
        />
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: colors.textTertiary }]}>
            {t('common.skip')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: fontWeight.bold as any,
    letterSpacing: 4,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold as any,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttons: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  spacer: {
    height: spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: fontSize.sm,
  },
});