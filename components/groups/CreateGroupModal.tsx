import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Share2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import TextField from '../ui/TextField';

const COPY_CONFIRM_DURATION_MS = 1500;

type CreateGroupModalProps = {
  visible: boolean;
  onCancel: () => void;
  onCreate: (
    nom: string,
    description: string
  ) => Promise<{ ok: boolean; error?: string; groupId?: string; codeInvitation?: string }>;
  onDone: (groupId: string) => void;
};

type Step = 'form' | { group: { nom: string; code: string; id: string } };

export default function CreateGroupModal({ visible, onCancel, onCreate, onDone }: CreateGroupModalProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = makeStyles(colors);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [justCopied, setJustCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setNom('');
      setDescription('');
      setError(undefined);
      setSubmitting(false);
      setStep('form');
    }
  }, [visible]);

  const handleClose = () => {
    if (submitting) return;
    if (step !== 'form') {
      onDone(step.group.id);
      return;
    }
    onCancel();
  };

  const handleSubmit = async () => {
    if (!nom.trim()) {
      setError(t('groups.errors.nameRequired'));
      return;
    }
    setSubmitting(true);
    const result = await onCreate(nom, description);
    setSubmitting(false);
    if (!result.ok || !result.groupId || !result.codeInvitation) {
      setError(result.error ?? t('groups.errors.createFailed'));
      return;
    }
    setStep({ group: { nom: nom.trim(), code: result.codeInvitation, id: result.groupId } });
  };

  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setJustCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setJustCopied(false), COPY_CONFIRM_DURATION_MS);
  };

  const handleShare = async (nomGroupe: string, code: string) => {
    try {
      await Share.share({ message: t('groups.create.shareMessage', { nom: nomGroupe, code }) });
    } catch {
      // User dismissed the native share sheet — nothing to do.
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={handleClose} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet}>
            {step === 'form' ? (
              <>
                <Text style={styles.title}>{t('groups.create.title')}</Text>
                <TextField
                  label={t('groups.create.nameLabel')}
                  value={nom}
                  onChangeText={(text) => {
                    setNom(text);
                    if (error) setError(undefined);
                  }}
                  placeholder={t('groups.create.namePlaceholder')}
                  error={error}
                  autoFocus
                />
                <TextField
                  label={t('groups.create.descriptionLabel')}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('groups.create.descriptionPlaceholder')}
                  multiline
                />
                <View style={styles.actions}>
                  <Button label={t('common.cancel')} variant="secondary" onPress={handleClose} disabled={submitting} style={styles.actionButton} />
                  <Button label={t('groups.create.submit')} onPress={handleSubmit} loading={submitting} style={styles.actionButton} />
                </View>
              </>
            ) : (
              <GroupCreatedStep
                nom={step.group.nom}
                code={step.group.code}
                justCopied={justCopied}
                onCopy={() => handleCopy(step.group.code)}
                onShare={() => handleShare(step.group.nom, step.group.code)}
                onDone={() => onDone(step.group.id)}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Split out so it can read the freshly-created group's real code once the parent refetches it.
function GroupCreatedStep({
  nom,
  code,
  justCopied,
  onCopy,
  onShare,
  onDone,
}: {
  nom: string;
  code: string;
  justCopied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = makeStyles(colors);

  return (
    <>
      <Text style={styles.title}>{t('groups.create.successTitle')}</Text>
      <Text style={styles.subtitle}>{t('groups.create.successSubtitle')}</Text>

      <View style={styles.codeBlock}>
        {code ? <Text style={styles.code}>{code}</Text> : <ActivityIndicator color={colors.accent} size="small" />}
        <Pressable accessibilityRole="button" accessibilityLabel={t('groups.create.copyLabel')} onPress={onCopy} disabled={!code} hitSlop={8}>
          {justCopied ? <Check color={colors.accent} size={20} /> : <Copy color={colors.accent} size={20} />}
        </Pressable>
      </View>
      {justCopied && <Text style={styles.copiedText}>{t('groups.create.copiedText')}</Text>}

      <Pressable
        accessibilityRole="button"
        onPress={onShare}
        disabled={!code}
        style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
      >
        <Share2 color={colors.accent} size={16} />
        <Text style={styles.shareLabel}>{t('groups.create.shareLabel')}</Text>
      </Pressable>

      <Button label={t('groups.create.doneButton')} onPress={onDone} style={styles.doneButton} />
    </>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii['2xl'],
      borderTopRightRadius: radii['2xl'],
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: -spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    codeBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderRadius: radii.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
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
      color: colors.textSecondary,
      textAlign: 'center',
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.background,
      borderRadius: radii.full,
      paddingVertical: spacing.md,
    },
    shareLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent,
    },
    doneButton: {
      marginTop: spacing.xs,
    },
  });
}
