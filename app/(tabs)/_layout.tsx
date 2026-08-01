import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Camera, Dumbbell, Home, MessageCircle, TrendingUp, User, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../constants/theme';

const TAB_BAR_MARGIN = 20;
const TAB_BAR_BOTTOM_MIN = 24;
const TAB_BAR_HEIGHT = 68;

function TabIcon({ Icon, label, focused }: { Icon: LucideIcon; label: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Icon color={focused ? colors.accent : colors.textTertiary} size={22} />
      <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// Bypasses React Navigation's default tab button, whose built-in style
// (`tabVerticalUiKit`) top-aligns content instead of centering it — no amount
// of tabBarItemStyle/tabBarIconStyle can reach that inner style, so the icon
// only centers reliably if we own the pressable ourselves.
function TabBarButton({ style, ...rest }: BottomTabBarButtonProps) {
  return <PlatformPressable {...rest} style={[style, styles.tabButton]} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // On devices with a home indicator, keep the bar (and its bottom-right tab)
  // clear of the safe-area/system-gesture zone instead of sitting at a fixed
  // 24px from the raw screen edge.
  const tabBarBottom = Math.max(TAB_BAR_BOTTOM_MIN, insets.bottom + 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarStyle: [styles.tabBar, { bottom: tabBarBottom }],
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home} label="Accueil" focused={focused} /> }}
      />
      <Tabs.Screen
        name="coach"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={MessageCircle} label="Coach" focused={focused} /> }}
      />
      <Tabs.Screen
        name="workout"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Dumbbell} label="Séance" focused={focused} /> }}
      />
      <Tabs.Screen
        name="scanner"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Camera} label="Scanner" focused={focused} /> }}
      />
      <Tabs.Screen
        name="progression"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={TrendingUp} label="Progression" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User} label="Profil" focused={focused} /> }}
      />
      <Tabs.Screen name="meals" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    height: TAB_BAR_HEIGHT,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabBarItem: {
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  labelActive: {
    color: colors.accent,
  },
});
