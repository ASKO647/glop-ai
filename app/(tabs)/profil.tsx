import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import { colors, radii, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, isSubscribed } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={typography.title}>Profil</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paramètres"
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
        >
          <Settings color={colors.textPrimary} size={20} />
        </Pressable>
      </View>

      <Card style={styles.accountCard}>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        <View style={[styles.statusPill, isSubscribed ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, isSubscribed ? styles.statusTextActive : styles.statusTextInactive]}>
            {isSubscribed ? 'Abonné' : 'Non abonné'}
          </Text>
        </View>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  email: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusPill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: colors.accentMuted,
  },
  statusInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: colors.accent,
  },
  statusTextInactive: {
    color: colors.textTertiary,
  },
});
