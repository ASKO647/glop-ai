import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { colors, radii, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { showConfirm } from '../../lib/alert';
import { supabase } from '../../lib/supabase';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, isSubscribed, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    router.replace('/welcome');
  };

  const handleDeleteAccount = () => {
    showConfirm(
      'Supprimer mon compte',
      'Cette action est définitive : toutes tes données seront supprimées. Veux-tu continuer ?',
      'Supprimer',
      async () => {
        setDeleting(true);
        if (user) {
          // TODO: supprimer réellement le compte Supabase Auth nécessite une Edge
          // Function avec la clé service_role. En attendant, on supprime le profil
          // et on déconnecte l'utilisateur.
          await supabase.from('profiles').delete().eq('id', user.id);
        }
        await signOut();
        setDeleting(false);
        router.replace('/welcome');
      }
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.top}>
        <View style={styles.header}>
          <Text style={typography.title}>Profil</Text>
        </View>

        <Card style={styles.accountCard}>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          <View style={[styles.statusPill, isSubscribed ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, isSubscribed ? styles.statusTextActive : styles.statusTextInactive]}>
              {isSubscribed ? 'Abonné' : 'Non abonné'}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button label="Se déconnecter" variant="secondary" loading={signingOut} onPress={handleSignOut} />
          <Button
            label="Supprimer mon compte"
            variant="danger"
            loading={deleting}
            onPress={handleDeleteAccount}
          />
        </View>
      </View>

      <View style={styles.linksRow}>
        <Text style={styles.link}>Conditions</Text>
        <Text style={styles.link}>·</Text>
        <Text style={styles.link}>Confidentialité</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  top: {
    gap: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
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
  actions: {
    gap: spacing.sm,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  link: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
