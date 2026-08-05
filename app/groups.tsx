import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import GroupCard from '../components/groups/GroupCard';
import TextInputModal from '../components/ui/TextInputModal';
import type { Colors } from '../constants/theme';
import { radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import { useGroups, type GroupSummary } from '../hooks/useGroups';

type ActiveModal = 'join' | 'create' | null;

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { groups, loading, joinByCode, createGroup } = useGroups(user?.id);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const closeModal = () => setActiveModal(null);

  const openGroup = (groupId: string) => {
    closeModal();
    router.push(`/group/${groupId}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('groups.headerTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!loading && groups.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Users color={colors.accent} size={32} />
          </View>
          <Text style={styles.emptyTitle}>{t('groups.empty.title')}</Text>
          <Text style={styles.emptySubtitle}>{t('groups.empty.subtitle')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveModal('join')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonLabel}>{t('groups.empty.joinButton')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveModal('create')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonLabel}>{t('groups.empty.createButton')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList<GroupSummary>
          data={groups}
          keyExtractor={(group) => group.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <GroupCard group={item} onPress={() => openGroup(item.id)} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {groups.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('groups.createFabAccessibility')}
          onPress={() => setActiveModal('create')}
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        >
          <Plus color={colors.onAccent} size={26} />
        </Pressable>
      )}

      <TextInputModal
        visible={activeModal === 'join'}
        title={t('groups.join.title')}
        initialValue=""
        placeholder={t('groups.join.placeholder')}
        autoCapitalize="characters"
        transform={(value) => value.toUpperCase()}
        onCancel={closeModal}
        onSave={async (code) => {
          const result = await joinByCode(code);
          if (!result.ok) return result.error;
          if (result.groupId) openGroup(result.groupId);
        }}
      />

      <CreateGroupModal
        visible={activeModal === 'create'}
        onCancel={closeModal}
        onCreate={createGroup}
        onDone={openGroup}
      />
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
      borderRadius: radii.full,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    headerSpacer: {
      width: 36,
    },
    headerTitle: {
      ...typography.heading,
      color: colors.textPrimary,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100,
      gap: spacing.sm,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    primaryButton: {
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderRadius: radii['2xl'],
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    primaryButtonLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.onAccent,
    },
    secondaryButton: {
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii['2xl'],
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    secondaryButtonLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  });
}
