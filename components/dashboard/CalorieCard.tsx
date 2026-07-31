import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import CalorieRing from './CalorieRing';
import MacroBar from './MacroBar';

type MacroValue = { current: number; target: number };

type CalorieCardProps = {
  caloriesRemaining: number;
  percent: number;
  proteines: MacroValue;
  glucides: MacroValue;
  lipides: MacroValue;
};

export default function CalorieCard({
  caloriesRemaining,
  percent,
  proteines,
  glucides,
  lipides,
}: CalorieCardProps) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>AUJOURD'HUI</Text>
          <Text style={styles.value}>{Math.max(0, Math.round(caloriesRemaining))}</Text>
          <Text style={styles.unit}>kcal restantes</Text>
        </View>
        <CalorieRing percent={percent} />
      </View>

      <View style={styles.macros}>
        <MacroBar label="Protéines" current={proteines.current} target={proteines.target} />
        <MacroBar label="Glucides" current={glucides.current} target={glucides.target} />
        <MacroBar label="Lipides" current={lipides.current} target={lipides.target} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/scanner')}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaText}>Continuer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.accent,
    borderRadius: radii.xl,
    padding: 20,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flexShrink: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.background,
    opacity: 0.6,
  },
  value: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.background,
    marginTop: 4,
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
    opacity: 0.7,
  },
  macros: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ctaPressed: {
    opacity: 0.7,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
});
