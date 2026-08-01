import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { QUICK_ADJUSTMENTS, WEIGHT_STEP, formatSignedWeight, formatWeight } from '../../constants/progression';
import { colors, radii, spacing } from '../../constants/theme';
import Button from '../ui/Button';

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 80;
const DEFAULT_WEIGHT = 70;

type WeightEntryModalProps = {
  visible: boolean;
  initialValue: number | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (poids: number) => void;
};

function roundToStep(value: number): number {
  return Math.round(value * 10) / 10;
}

export default function WeightEntryModal({ visible, initialValue, saving, onCancel, onSave }: WeightEntryModalProps) {
  const [value, setValue] = useState(initialValue ?? DEFAULT_WEIGHT);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRepeated = useRef(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue ?? DEFAULT_WEIGHT);
    }
  }, [visible, initialValue]);

  const clearTimers = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  const adjust = (delta: number) => {
    setValue((prev) => Math.max(0, roundToStep(prev + delta)));
  };

  const handlePressIn = (delta: number) => {
    hasRepeated.current = false;
    pressTimer.current = setTimeout(() => {
      hasRepeated.current = true;
      repeatTimer.current = setInterval(() => adjust(delta), REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  };

  const handlePressOut = (delta: number) => {
    clearTimers();
    if (!hasRepeated.current) {
      adjust(delta);
    }
  };

  const handleCancel = () => {
    clearTimers();
    onCancel();
  };

  const handleSave = () => {
    clearTimers();
    onSave(roundToStep(value));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={handleCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>Ton poids aujourd'hui</Text>

          <View style={styles.stepperRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Diminuer de 0,1 kg"
              onPressIn={() => handlePressIn(-WEIGHT_STEP)}
              onPressOut={() => handlePressOut(-WEIGHT_STEP)}
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
            >
              <Minus color={colors.textPrimary} size={28} />
            </Pressable>

            <View style={styles.valueBlock}>
              <Text style={styles.value}>{formatWeight(value)}</Text>
              <Text style={styles.unit}>kg</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Augmenter de 0,1 kg"
              onPressIn={() => handlePressIn(WEIGHT_STEP)}
              onPressOut={() => handlePressOut(WEIGHT_STEP)}
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
            >
              <Plus color={colors.textPrimary} size={28} />
            </Pressable>
          </View>

          <View style={styles.quickRow}>
            {QUICK_ADJUSTMENTS.map((delta) => (
              <Pressable
                key={delta}
                accessibilityRole="button"
                onPress={() => adjust(delta)}
                style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
              >
                <Text style={styles.quickLabel}>{formatSignedWeight(delta)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Annuler" variant="secondary" onPress={handleCancel} disabled={saving} style={styles.actionButton} />
            <Button label="Enregistrer" onPress={handleSave} loading={saving} style={styles.actionButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stepButton: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    opacity: 0.7,
  },
  valueBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 150,
  },
  value: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
  },
  unit: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  quickPill: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  quickPillPressed: {
    opacity: 0.7,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
