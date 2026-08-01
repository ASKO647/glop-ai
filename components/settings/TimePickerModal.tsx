import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import Button from '../ui/Button';

const MINUTE_STEP = 5;

type TimePickerModalProps = {
  visible: boolean;
  title: string;
  /** "HH:MM" */
  initialValue: string;
  saving?: boolean;
  onCancel: () => void;
  onSave: (value: string) => void;
};

function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map((part) => parseInt(part, 10));
  const hour = Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 8;
  const rawMinute = Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0;
  const minute = Math.round(rawMinute / MINUTE_STEP) * MINUTE_STEP;
  return { hour, minute: minute >= 60 ? 0 : minute };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function wrap(value: number, max: number): number {
  return ((value % max) + max) % max;
}

export default function TimePickerModal({ visible, title, initialValue, saving = false, onCancel, onSave }: TimePickerModalProps) {
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (visible) {
      const parsed = parseTime(initialValue);
      setHour(parsed.hour);
      setMinute(parsed.minute);
    }
  }, [visible, initialValue]);

  const handleSave = () => {
    onSave(`${pad(hour)}:${pad(minute)}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.timeRow}>
            <View style={styles.unitColumn}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Heure suivante"
                onPress={() => setHour((h) => wrap(h + 1, 24))}
                style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
              >
                <Plus color={colors.textPrimary} size={20} />
              </Pressable>
              <Text style={styles.unitValue}>{pad(hour)}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Heure précédente"
                onPress={() => setHour((h) => wrap(h - 1, 24))}
                style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
              >
                <Minus color={colors.textPrimary} size={20} />
              </Pressable>
              <Text style={styles.unitLabel}>heures</Text>
            </View>

            <Text style={styles.separator}>:</Text>

            <View style={styles.unitColumn}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Minutes suivantes"
                onPress={() => setMinute((m) => wrap(m + MINUTE_STEP, 60))}
                style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
              >
                <Plus color={colors.textPrimary} size={20} />
              </Pressable>
              <Text style={styles.unitValue}>{pad(minute)}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Minutes précédentes"
                onPress={() => setMinute((m) => wrap(m - MINUTE_STEP, 60))}
                style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
              >
                <Minus color={colors.textPrimary} size={20} />
              </Pressable>
              <Text style={styles.unitLabel}>minutes</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button label="Annuler" variant="secondary" onPress={onCancel} disabled={saving} style={styles.actionButton} />
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  unitColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    opacity: 0.7,
  },
  unitValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  unitLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  separator: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
