import { useRouter } from 'expo-router';
import { Clock, Flame } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WORKOUT_CATEGORY_IMAGES, type WorkoutSession } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import AppImage from '../ui/AppImage';

type WorkoutCardProps = {
  session: WorkoutSession;
};

export default function WorkoutCard({ session }: WorkoutCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/workout/${session.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <AppImage source={WORKOUT_CATEGORY_IMAGES[session.category]} style={styles.thumbnail} overlay={0.4} />
      <View style={styles.info}>
        <Text style={styles.title}>{session.title}</Text>
        <Text style={styles.muscles} numberOfLines={1}>
          {session.muscles}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={styles.metaText}>{session.duration} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Flame color={colors.textSecondary} size={14} />
            <Text style={styles.metaText}>{session.kcal} kcal</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    pressed: {
      opacity: 0.7,
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: radii.md,
    },
    info: {
      flex: 1,
      gap: 6,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    muscles: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    metaRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: 4,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
