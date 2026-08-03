import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, CreditCard, ExternalLink, RefreshCw } from 'lucide-react-native';
import { useMemo } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const SUBSCRIPTION_MANAGEMENT_URL =
  Platform.OS === 'android'
    ? 'https://play.google.com/store/account/subscriptions'
    : 'https://apps.apple.com/account/subscriptions';

// TODO: lire la formule et la date de renouvellement depuis RevenueCat une fois le paiement branché.
const MOCK_PLAN = 'Mensuel';

function getMockRenewalDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function openSubscriptionSettings() {
  Linking.openURL(SUBSCRIPTION_MANAGEMENT_URL);
}

export default function SubscriptionCard({ isSubscribed }: { isSubscribed: boolean }) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!isSubscribed) {
    return (
      <View style={styles.promoCard}>
        <Text style={styles.promoTitle}>Passe à Premium</Text>
        <Text style={styles.promoSubtitle}>Débloque ton coach IA et le scanner de repas</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/paywall')}
          style={({ pressed }) => [styles.promoButton, pressed && styles.pressed]}
        >
          <Text style={styles.promoButtonLabel}>Voir les offres</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <CreditCard color={colors.textSecondary} size={20} />
        </View>
        <Text style={styles.label}>Formule</Text>
        <Text style={styles.value}>{MOCK_PLAN}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Calendar color={colors.textSecondary} size={20} />
        </View>
        <Text style={styles.label}>Prochain renouvellement</Text>
        <Text style={styles.value}>{getMockRenewalDate()}</Text>
      </View>

      <View style={styles.separator} />

      <Pressable
        accessibilityRole="button"
        onPress={openSubscriptionSettings}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.iconBox}>
          <ExternalLink color={colors.textSecondary} size={20} />
        </View>
        <Text style={styles.label}>Gérer mon abonnement</Text>
        <ChevronRight color={colors.textTertiary} size={18} />
      </Pressable>

      <Text style={styles.hint}>Les modifications et résiliations se font depuis les réglages de ton téléphone.</Text>

      <View style={styles.separator} />

      <Pressable
        accessibilityRole="button"
        onPress={openSubscriptionSettings}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.iconBox}>
          <RefreshCw color={colors.textSecondary} size={20} />
        </View>
        <Text style={styles.label}>Changer de formule</Text>
        <ChevronRight color={colors.textTertiary} size={18} />
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 56,
    },
    pressed: {
      opacity: 0.7,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    value: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 36 + spacing.md + spacing.sm,
    },
    hint: {
      fontSize: 11,
      color: colors.textSecondary,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    promoCard: {
      backgroundColor: colors.accent,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: 4,
    },
    // Upgrade CTA card — text sits directly on the accent-filled card, so it uses onAccent,
    // not colors.background (that pairing only worked by coincidence in the dark-only palette).
    promoTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.onAccent,
    },
    promoSubtitle: {
      fontSize: 13,
      color: colors.onAccent,
      opacity: 0.7,
      marginBottom: spacing.sm,
    },
    // Button reads as a "cutout" of the app's own background sitting on the accent card
    // (same pattern as CalorieCard's cta), so it keeps the background/accent pairing rather
    // than onAccent.
    promoButton: {
      backgroundColor: colors.background,
      borderRadius: radii.full,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    promoButtonLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent,
    },
  });
}
