import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Colors } from '../../constants/theme';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.paragraph}>
          Cette politique de confidentialité décrit quelles données GlowUp AI collecte (profil, repas, pesées,
          photos de progression, historique du coach) et comment elles sont utilisées pour faire fonctionner
          l'application.
        </Text>
        <Text style={styles.paragraph}>
          Ce texte est un placeholder — le contenu juridique définitif sera rédigé avant la mise en production de
          l'application.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 36,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    paragraph: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
  });
}
