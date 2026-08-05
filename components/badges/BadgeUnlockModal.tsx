import { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import type { BadgeDefinition } from '../../constants/badges';
import type { Colors } from '../../constants/theme';
import { radii, spacing, typography } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import BadgeMedal from './BadgeMedal';

type BadgeUnlockModalProps = {
  badge: BadgeDefinition | null;
  onDismiss: () => void;
};

/** Celebration modal for a single newly-unlocked badge — the caller queues badges and only ever passes one at a time. */
export default function BadgeUnlockModal({ badge, onDismiss }: BadgeUnlockModalProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {badge && (
          <View style={styles.card}>
            <BadgeMedal Icon={badge.Icon} unlocked size={96} iconSize={40} />
            <Text style={styles.eyebrow}>{t('badges.unlockedTitle')}</Text>
            <Text style={styles.name}>{t(badge.nameKey)}</Text>
            <Text style={styles.description}>{t(badge.descriptionKey)}</Text>
            <Button label={t('badges.unlockedButton')} onPress={onDismiss} style={styles.button} />
          </View>
        )}
      </View>
    </Modal>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii['2xl'],
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      gap: spacing.xs,
    },
    eyebrow: {
      marginTop: spacing.md,
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    name: {
      ...typography.heading,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    button: {
      alignSelf: 'stretch',
    },
  });
}
