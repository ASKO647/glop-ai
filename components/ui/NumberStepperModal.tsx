import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 80;

export type NumberStepperModalProps = {
  visible: boolean;
  title: string;
  initialValue: number;
  unit: string;
  /** Single-tap increment. Defaults to 0.1. */
  step?: number;
  /** Quick-adjustment shortcut pills (e.g. [-1, -0.5, 0.5, 1]). Omit to hide the row. */
  quickAdjustments?: number[];
  min?: number;
  saving?: boolean;
  onCancel: () => void;
  onSave: (value: number) => void;
};

function formatValue(value: number, decimals: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatSigned(value: number, decimals: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatValue(Math.abs(value), decimals)}`;
}

/** A keyboard-free numeric input: ±step buttons (tap once, hold to repeat) plus optional quick-adjustment pills. */
export default function NumberStepperModal({
  visible,
  title,
  initialValue,
  unit,
  step = 0.1,
  quickAdjustments,
  min = 0,
  saving = false,
  onCancel,
  onSave,
}: NumberStepperModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const decimals = Number.isInteger(step) ? 0 : 1;
  const [value, setValue] = useState(initialValue);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRepeated = useRef(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
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

  const roundToStep = (raw: number) => {
    const factor = 10 ** decimals;
    return Math.round(raw * factor) / factor;
  };

  const adjust = (delta: number) => {
    setValue((prev) => Math.max(min, roundToStep(prev + delta)));
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
          <Text style={styles.title}>{title}</Text>

          <View style={styles.stepperRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Diminuer de ${formatValue(step, decimals)} ${unit}`}
              onPressIn={() => handlePressIn(-step)}
              onPressOut={() => handlePressOut(-step)}
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
            >
              <Minus color={colors.textPrimary} size={28} />
            </Pressable>

            <View style={styles.valueBlock}>
              <Text style={styles.value}>{formatValue(value, decimals)}</Text>
              <Text style={styles.unit}>{unit}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Augmenter de ${formatValue(step, decimals)} ${unit}`}
              onPressIn={() => handlePressIn(step)}
              onPressOut={() => handlePressOut(step)}
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
            >
              <Plus color={colors.textPrimary} size={28} />
            </Pressable>
          </View>

          {quickAdjustments && quickAdjustments.length > 0 && (
            <View style={styles.quickRow}>
              {quickAdjustments.map((delta) => (
                <Pressable
                  key={delta}
                  accessibilityRole="button"
                  onPress={() => adjust(delta)}
                  style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
                >
                  <Text style={styles.quickLabel}>{formatSigned(delta, decimals)}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button label="Annuler" variant="secondary" onPress={handleCancel} disabled={saving} style={styles.actionButton} />
            <Button label="Enregistrer" onPress={handleSave} loading={saving} style={styles.actionButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
}
