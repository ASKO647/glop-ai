import { Modal, StyleSheet, Text, View } from 'react-native';
import type { BadgeDefinition } from '../../constants/badges';
import { colors, radii, spacing, typography } from '../../constants/theme';
import Button from '../ui/Button';
import BadgeMedal from './BadgeMedal';

type BadgeUnlockModalProps = {
  badge: BadgeDefinition | null;
  onDismiss: () => void;
};

/** Celebration modal for a single newly-unlocked badge — the caller queues badges and only ever passes one at a time. */
export default function BadgeUnlockModal({ badge, onDismiss }: BadgeUnlockModalProps) {
  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {badge && (
          <View style={styles.card}>
            <BadgeMedal Icon={badge.Icon} unlocked size={96} iconSize={40} />
            <Text style={styles.eyebrow}>Badge débloqué !</Text>
            <Text style={styles.name}>{badge.name}</Text>
            <Text style={styles.description}>{badge.description}</Text>
            <Button label="Super !" onPress={onDismiss} style={styles.button} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
