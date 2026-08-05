import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { computeExpectedEnd, formatHourMinute } from '../../constants/fasting';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';

const STEP_MINUTES = 15;
const MAX_MINUTES_AGO = 720;
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 120;

type FastingStartModalProps = {
  visible: boolean;
  targetHours: number;
  saving?: boolean;
  onCancel: () => void;
  onStart: (startAt: Date) => void;
};

export default function FastingStartModal({
  visible,
  targetHours,
  saving = false,
  onCancel,
  onStart,
}: FastingStartModalProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [anchor, setAnchor] = useState(() => new Date());
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRepeated = useRef(false);

  useEffect(() => {
    if (visible) {
      setMinutesAgo(0);
      setAnchor(new Date());
    }
  }, [visible]);

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
    setMinutesAgo((prev) => Math.min(MAX_MINUTES_AGO, Math.max(0, prev + delta)));
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
    if (!hasRepeated.current) adjust(delta);
  };

  const startAt = useMemo(() => new Date(anchor.getTime() - minutesAgo * 60000), [anchor, minutesAgo]);
  const expectedEnd = useMemo(() => computeExpectedEnd(startAt, targetHours), [startAt, targetHours]);

  const handleCancel = () => {
    clearTimers();
    onCancel();
  };

  const handleStart = () => {
    clearTimers();
    onStart(startAt);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={handleCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>{t('dashboard.fasting.startCtaLong')}</Text>

          <View style={styles.startBlock}>
            <Text style={styles.startLabel}>{t('dashboard.fasting.startLabel')}</Text>
            <Text style={styles.startValue}>
              {minutesAgo === 0 ? t('dashboard.fasting.now') : formatHourMinute(startAt)}
            </Text>
          </View>

          <View style={styles.stepperRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.fasting.shiftEarlier', { minutes: STEP_MINUTES })}
              disabled={minutesAgo >= MAX_MINUTES_AGO}
              onPressIn={() => handlePressIn(STEP_MINUTES)}
              onPressOut={() => handlePressOut(STEP_MINUTES)}
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
            >
              <Minus color={colors.textPrimary} size={24} />
            </Pressable>

            <Text style={styles.minutesAgoText}>
              {minutesAgo === 0 ? t('dashboard.fasting.agoNow') : t('dashboard.fasting.minutesAgo', { minutes: minutesAgo })}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.fasting.shiftLater', { minutes: STEP_MINUTES })}
              disabled={minutesAgo <= 0}
              onPressIn={() => handlePressIn(-STEP_MINUTES)}
              onPressOut={() => handlePressOut(-STEP_MINUTES)}
              style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
            >
              <Plus color={colors.textPrimary} size={24} />
            </Pressable>
          </View>

          <View style={styles.endBlock}>
            <Text style={styles.endLabel}>{t('dashboard.fasting.endLabelStandalone')}</Text>
            <Text style={styles.endValue}>{formatHourMinute(expectedEnd)}</Text>
          </View>

          <Button label={t('dashboard.fasting.startShort')} onPress={handleStart} loading={saving} />
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
      gap: spacing.md,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    startBlock: {
      alignItems: 'center',
      gap: 2,
    },
    startLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    startValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.accent,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    stepButton: {
      width: 48,
      height: 48,
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
    minutesAgoText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      minWidth: 90,
      textAlign: 'center',
    },
    endBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    endLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    endValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
}
