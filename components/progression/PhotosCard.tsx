import { Camera } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

export default function PhotosCard() {
  return (
    <View style={styles.card}>
      <Camera color={colors.textTertiary} size={28} />
      <Text style={styles.title}>Ajoute ta première photo</Text>
      <Text style={styles.subtitle}>Bientôt disponible</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
