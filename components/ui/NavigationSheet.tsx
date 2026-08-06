import { useRouter } from 'expo-router';
import {
  Award,
  Bell,
  ChefHat,
  Dumbbell,
  LayoutGrid,
  Sparkles,
  TrendingUp,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { showAlert } from '../../lib/alert';

type NavItem = {
  key: string;
  labelKey: string;
  Icon: LucideIcon;
  route?: string;
  comingSoon?: boolean;
};

const GRID_ITEMS: NavItem[] = [
  // Coach isn't listed here — it left for a full tab of its own.
  { key: 'progression', labelKey: 'common.navItems.progression', Icon: TrendingUp, route: '/progression' },
  { key: 'workout', labelKey: 'common.navItems.workout', Icon: Dumbbell, route: '/workout' },
  { key: 'meals', labelKey: 'common.navItems.meals', Icon: Utensils, route: '/meals' },
  { key: 'notifications', labelKey: 'common.navItems.notifications', Icon: Bell, route: '/notifications' },
  { key: 'badges', labelKey: 'common.navItems.badges', Icon: Award, route: '/badges' },
  { key: 'groups', labelKey: 'common.navItems.groups', Icon: Users, route: '/groups' },
  { key: 'widgets', labelKey: 'common.navItems.widgets', Icon: LayoutGrid, comingSoon: true },
  { key: 'recipes', labelKey: 'common.navItems.recipes', Icon: ChefHat, route: '/recipes' },
  { key: 'skincare', labelKey: 'common.navItems.skincare', Icon: Sparkles, route: '/skincare' },
];

// Chunked into fixed pairs rather than left to flex-wrap, which would fit 3 (or more)
// 110px cards per row on wider screens instead of the requested 2-column grid.
const GRID_ROWS: NavItem[][] = [];
for (let i = 0; i < GRID_ITEMS.length; i += 2) {
  GRID_ROWS.push(GRID_ITEMS.slice(i, i + 2));
}

const SHEET_OFFSCREEN = 420;
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 0.5;

type NavigationSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export default function NavigationSheet({ visible, onClose }: NavigationSheetProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(visible);
  const translateY = useRef(new Animated.Value(SHEET_OFFSCREEN)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setModalVisible(true);
    translateY.setValue(SHEET_OFFSCREEN);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, translateY, backdropOpacity]);

  const animateClose = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SHEET_OFFSCREEN, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
      after?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          animateClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    })
  ).current;

  const handlePressItem = (item: NavItem) => {
    if (item.comingSoon) {
      showAlert(t('common.comingSoonAlertTitle'), t('common.comingSoonAlertMessage', { label: t(item.labelKey) }));
      return;
    }
    if (!item.route) return;
    animateClose(() => router.push(item.route!));
  };

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={() => animateClose()}>
      <View style={styles.backdropWrap}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={() => animateClose()} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>{t('common.explore')}</Text>
          </View>

          <View style={styles.grid}>
            {GRID_ROWS.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityLabel={
                      item.comingSoon
                        ? t('common.comingSoonAccessibility', { label: t(item.labelKey) })
                        : t(item.labelKey)
                    }
                    onPress={() => handlePressItem(item)}
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  >
                    {item.comingSoon && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonBadgeText}>{t('common.comingSoon')}</Text>
                      </View>
                    )}
                    <item.Icon color={item.comingSoon ? colors.textTertiary : colors.accent} size={26} />
                    <Text style={[styles.cardLabel, item.comingSoon && styles.cardLabelMuted]}>{t(item.labelKey)}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    backdropWrap: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii['2xl'],
      borderTopRightRadius: radii['2xl'],
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    header: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: radii.full,
      backgroundColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    grid: {
      alignItems: 'center',
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    card: {
      width: 110,
      height: 110,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    cardPressed: {
      opacity: 0.7,
    },
    cardLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    cardLabelMuted: {
      color: colors.textTertiary,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      backgroundColor: colors.border,
      borderRadius: radii.full,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    comingSoonBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.labelMuted,
    },
  });
}
