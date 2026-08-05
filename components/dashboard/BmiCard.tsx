import { useRouter } from 'expo-router';
import { Activity } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BMI_CATEGORY_IDS,
  BMI_SEGMENT_WIDTHS_PERCENT,
  bmiCategoryColor,
  bmiThresholdToPercent,
  bmiToPercent,
  computeBmi,
  formatBmi,
  getBmiCategory,
  BMI_THRESHOLDS,
} from '../../constants/bmi';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import BmiInfoModal from './BmiInfoModal';

type BmiCardProps = {
  weightKg: number | null;
  heightCm: number | null;
};

const BOUNDARY_VALUES = [BMI_THRESHOLDS.underweight, BMI_THRESHOLDS.overweight, BMI_THRESHOLDS.obese];

export default function BmiCard({ weightKg, heightCm }: BmiCardProps) {
  const router = useRouter();
  const { colors, resolvedScheme } = useTheme();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [infoVisible, setInfoVisible] = useState(false);

  const bmi = weightKg != null && heightCm != null ? computeBmi(weightKg, heightCm) : null;
  const category = bmi != null ? getBmiCategory(bmi, t) : null;

  const cursorOpacity = useRef(new Animated.Value(0)).current;
  const cursorOffset = useRef(new Animated.Value(-6)).current;

  useEffect(() => {
    if (bmi == null) return;
    cursorOpacity.setValue(0);
    cursorOffset.setValue(-6);
    Animated.parallel([
      Animated.timing(cursorOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(cursorOffset, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
    ]).start();
  }, [bmi, cursorOpacity, cursorOffset]);

  if (bmi == null || category == null) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Activity color={colors.accent} size={18} />
          </View>
          <Text style={styles.title}>{t('progression.bmi.title')}</Text>
        </View>
        <Text style={styles.missingText}>{t('progression.bmi.missingDashboard')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profil')}
          style={({ pressed }) => [styles.missingLink, pressed && styles.pressed]}
        >
          <Text style={styles.missingLinkText}>{t('progression.bmi.completeProfile')}</Text>
        </Pressable>
      </View>
    );
  }

  const categoryColor = bmiCategoryColor(colors, resolvedScheme, category.id);
  const cursorPercent = bmiToPercent(bmi);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('progression.bmi.cardAccessibility', { value: formatBmi(bmi, locale), category: category.label })}
        onPress={() => setInfoVisible(true)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Activity color={colors.accent} size={18} />
          </View>
          <Text style={styles.title}>{t('progression.bmi.title')}</Text>
        </View>

        <Text style={styles.value}>{formatBmi(bmi, locale)}</Text>
        <Text style={[styles.status, { color: categoryColor }]}>{category.label}</Text>

        <View style={styles.barWrap}>
          <Animated.View
            style={[
              styles.cursor,
              {
                left: `${cursorPercent}%`,
                opacity: cursorOpacity,
                transform: [{ translateY: cursorOffset }],
              },
            ]}
          />
          <View style={styles.bar}>
            {BMI_CATEGORY_IDS.map((id, index) => (
              <View
                key={id}
                style={[
                  styles.segment,
                  {
                    width: `${BMI_SEGMENT_WIDTHS_PERCENT[index]}%`,
                    backgroundColor: bmiCategoryColor(colors, resolvedScheme, id),
                  },
                ]}
              />
            ))}
          </View>
          {BOUNDARY_VALUES.map((value) => (
            <Text
              key={value}
              style={[styles.boundaryLabel, { left: `${bmiThresholdToPercent(value)}%` }]}
            >
              {formatBmi(value, locale).replace(',0', '')}
            </Text>
          ))}
        </View>

        <Text style={styles.explanation}>{category.explanation}</Text>
      </Pressable>

      <BmiInfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.xs,
    },
    cardPressed: {
      opacity: 0.85,
    },
    pressed: {
      opacity: 0.7,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    value: {
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.accent,
    },
    status: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    barWrap: {
      marginTop: spacing.xs,
      paddingTop: 14,
      paddingBottom: 4,
    },
    bar: {
      flexDirection: 'row',
      height: 10,
      borderRadius: radii.full,
      overflow: 'hidden',
    },
    segment: {
      height: '100%',
    },
    // Fixed white with a soft dark ring, not theme-reactive: it has to stay visible sitting on
    // top of all four bar segment colors (pale blue/accent/orange/red), in both themes.
    cursor: {
      position: 'absolute',
      top: 0,
      marginLeft: -5,
      width: 0,
      height: 0,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: 7,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#ffffff',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
    },
    boundaryLabel: {
      position: 'absolute',
      top: 24,
      fontSize: 9,
      color: colors.textTertiary,
      transform: [{ translateX: -8 }],
    },
    explanation: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 15,
    },
    missingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    missingLink: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
    },
    missingLinkText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
    },
  });
}
