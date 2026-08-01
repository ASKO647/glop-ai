import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Share2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

const COPY_CONFIRM_DURATION_MS = 1500;

type ReferralCardProps = {
  code: string | null;
  referredCount: number;
  loading: boolean;
};

export default function ReferralCard({ code, referredCount, loading }: ReferralCardProps) {
  const [justCopied, setJustCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setJustCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setJustCopied(false), COPY_CONFIRM_DURATION_MS);
  };

  const handleShare = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `Rejoins-moi sur GlowUp AI et obtiens 1 mois offert avec mon code ${code}`,
      });
    } catch {
      // User dismissed the native share sheet — nothing to do.
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Invite tes amis</Text>
      <Text style={styles.subtitle}>Ils obtiennent 1 mois offert, tu gagnes 10€</Text>

      <View style={styles.codeBlock}>
        {loading || !code ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Text style={styles.code}>{code}</Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copier le code"
          onPress={handleCopy}
          disabled={!code}
          hitSlop={8}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          {justCopied ? <Check color={colors.accent} size={20} /> : <Copy color={colors.accent} size={20} />}
        </Pressable>
      </View>
      {justCopied && <Text style={styles.copiedText}>Code copié</Text>}

      <Pressable
        accessibilityRole="button"
        onPress={handleShare}
        disabled={!code}
        style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
      >
        <Share2 color={colors.accent} size={16} />
        <Text style={styles.shareLabel}>Partager mon code</Text>
      </Pressable>

      <Text style={styles.friendsCount}>
        {referredCount} ami{referredCount > 1 ? 's' : ''} parrainé{referredCount > 1 ? 's' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.accent,
    borderRadius: radii.xl,
    padding: 20,
    gap: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.background,
  },
  subtitle: {
    fontSize: 13,
    color: colors.background,
    opacity: 0.7,
    marginTop: -4,
  },
  codeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    minHeight: 52,
  },
  code: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  copiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
    opacity: 0.8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  shareLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  friendsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
