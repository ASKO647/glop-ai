import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type MealRowProps = {
  name: string;
  time: string;
  kcal: number;
};

export default function MealRow({ name, time, kcal }: MealRowProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/meals')}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      <Text style={styles.kcal}>{kcal} kcal</Text>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    pressed: {
      opacity: 0.7,
    },
    info: {
      flexShrink: 1,
      marginRight: spacing.sm,
    },
    name: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    time: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    kcal: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.accent,
    },
  });
}
