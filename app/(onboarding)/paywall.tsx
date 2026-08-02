import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BenefitRow from '../../components/onboarding/BenefitRow';
import PlanCard from '../../components/onboarding/PlanCard';
import Button from '../../components/ui/Button';
import { colors, radii, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const BENEFITS = [
  { label: 'Coach IA illimité, chat & vocal', image: require('../../assets/images/benefit-coach.jpg') },
  { label: 'Scanner de repas par photo', image: require('../../assets/images/benefit-scanner.jpg') },
  { label: 'Programmes muscu personnalisés', image: require('../../assets/images/benefit-workout.jpg') },
  { label: 'Suivi de progression & statistiques', image: require('../../assets/images/benefit-progress.jpg') },
];

type PlanId = 'annual' | 'monthly';

export default function PaywallScreen() {
  const router = useRouter();
  const { user, signOut, refreshSubscription } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Closing without subscribing must not grant access to the app — sign the user
  // out and send them back to the very start of onboarding.
  const handleClose = async () => {
    await signOut();
    router.replace('/welcome');
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setError(undefined);
    setSubmitting(true);

    // TODO: remplacer par RevenueCat
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_subscribed: true })
      .eq('id', user.id);

    if (updateError) {
      setError('Une erreur est survenue. Réessaie.');
      setSubmitting(false);
      return;
    }

    await refreshSubscription();
    setSubmitting(false);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer"
        onPress={handleClose}
        hitSlop={12}
        style={styles.closeButton}
      >
        <X color={colors.labelMuted} size={22} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Choisis ton plan</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Débloque ton coach IA et commence ta transformation dès aujourd'hui.
        </Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <BenefitRow key={benefit.label} label={benefit.label} image={benefit.image} />
        ))}
      </View>

      <View style={styles.plans}>
        <PlanCard
          badge="MEILLEURE OFFRE"
          name="Annuel"
          price="59,99€ / an"
          originalPrice="180€"
          trialLabel="3 jours offerts"
          subline="Soit 4,99€ / mois. Puis 59,99€ par an. Annulable à tout moment."
          selected={selectedPlan === 'annual'}
          onPress={() => setSelectedPlan('annual')}
        />
        <PlanCard
          name="Mensuel"
          price="9,99€ / mois"
          originalPrice="35€"
          trialLabel="3 jours offerts"
          subline="Puis 9,99€ par mois. Annulable à tout moment."
          selected={selectedPlan === 'monthly'}
          onPress={() => setSelectedPlan('monthly')}
        />
      </View>

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Commencer mon essai gratuit"
          variant="primary"
          style={styles.ctaButton}
          loading={submitting}
          onPress={handleSubscribe}
        />
        <View style={styles.linksRow}>
          <Text style={styles.link}>Restaurer</Text>
          <Text style={styles.link}>·</Text>
          <Text style={styles.link}>Conditions</Text>
          <Text style={styles.link}>·</Text>
          <Text style={styles.link}>Confidentialité</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    width: 32,
    height: 32,
    marginTop: spacing.xs,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  header: {
    marginTop: spacing.xs,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  benefits: {
    marginTop: spacing.lg,
    gap: 10,
  },
  plans: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  error: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.danger,
  },
  ctaButton: {
    height: 52,
    borderRadius: radii.lg,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  link: {
    fontSize: 10,
    color: colors.textTertiary,
  },
});
