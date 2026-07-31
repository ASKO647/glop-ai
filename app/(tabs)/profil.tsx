import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={typography.title}>Profil</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Button label="Se déconnecter" variant="secondary" onPress={handleSignOut} />
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
  header: {
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    marginBottom: spacing.lg,
  },
});
