import { usePathname, useRouter } from 'expo-router';
import {
  Award,
  Camera,
  ChefHat,
  Dumbbell,
  Home,
  MessageCircle,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appImage } from '../../constants/images';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { useHover } from '../../hooks/useHover';
import AppImage from './AppImage';

export const DESKTOP_SIDEBAR_WIDTH = 240;

// Brand name — not translated, same as its other hardcoded appearances across the app (e.g.
// legal screens, permission prompts).
const APP_NAME = 'GlowUp AI';

type SidebarItem = { key: string; labelKey: string; Icon: LucideIcon; route: string };

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'home', labelKey: 'common.tabs.home', Icon: Home, route: '/' },
  { key: 'coach', labelKey: 'common.tabs.coach', Icon: MessageCircle, route: '/coach' },
  { key: 'scanner', labelKey: 'common.tabs.scanner', Icon: Camera, route: '/scanner' },
  { key: 'progression', labelKey: 'common.navItems.progression', Icon: TrendingUp, route: '/progression' },
  { key: 'workout', labelKey: 'common.navItems.workout', Icon: Dumbbell, route: '/workout' },
  { key: 'meals', labelKey: 'common.navItems.meals', Icon: Utensils, route: '/meals' },
  { key: 'recipes', labelKey: 'common.navItems.recipes', Icon: ChefHat, route: '/recipes' },
  { key: 'groups', labelKey: 'common.navItems.groups', Icon: Users, route: '/groups' },
  { key: 'badges', labelKey: 'common.navItems.badges', Icon: Award, route: '/badges' },
  { key: 'skincare', labelKey: 'common.navItems.skincare', Icon: Sparkles, route: '/skincare' },
  { key: 'profil', labelKey: 'common.tabs.profile', Icon: User, route: '/profil' },
];

function isActiveRoute(pathname: string, route: string): boolean {
  if (route === '/') return pathname === '/';
  return pathname === route || pathname.startsWith(`${route}/`);
}

function SidebarRow({ item, active, colors, styles }: { item: SidebarItem; active: boolean; colors: Colors; styles: ReturnType<typeof makeStyles> }) {
  const router = useRouter();
  const { t } = useLocale();
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(item.labelKey)}
      accessibilityState={{ selected: active }}
      onPress={() => router.push(item.route as never)}
      style={[styles.row, active && styles.rowActive, !active && hovered && styles.rowHovered]}
      {...hoverProps}
    >
      <item.Icon color={active ? colors.accent : colors.textSecondary} size={20} />
      <Text style={[styles.rowLabel, active && styles.rowLabelActive]} numberOfLines={1}>
        {t(item.labelKey)}
      </Text>
    </Pressable>
  );
}

/**
 * Fixed 240px left navigation for desktop only — replaces the floating tab bar/`+` sheet with
 * every destination visible at once. Mounted once at the root layout so it persists across
 * screens that live outside the `(tabs)` group (badges, recipes, groups, skincare, ...).
 */
export default function DesktopSidebar() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const pathname = usePathname();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoRow}>
        <AppImage source={appImage('logo-mark.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.logoText}>{APP_NAME}</Text>
      </View>

      <View style={styles.nav}>
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarRow key={item.key} item={item} active={isActiveRoute(pathname, item.route)} colors={colors} styles={styles} />
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    sidebar: {
      width: DESKTOP_SIDEBAR_WIDTH,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingVertical: spacing.lg,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    logo: {
      width: 28,
      height: 28,
    },
    logoText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    nav: {
      paddingHorizontal: spacing.sm,
      gap: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: radii.md,
    },
    rowActive: {
      backgroundColor: colors.accentSurface,
    },
    rowHovered: {
      backgroundColor: '#1a1f18',
    },
    rowLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    rowLabelActive: {
      color: colors.accent,
    },
  });
}
