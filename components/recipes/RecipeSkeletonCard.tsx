import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const CARD_HEIGHT = 220;

/** Pulsing placeholder shown in place of a `RecipeIdeaCard` while a category is generating. */
export default function RecipeSkeletonCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.card, { opacity }]} />;
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      height: CARD_HEIGHT,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
