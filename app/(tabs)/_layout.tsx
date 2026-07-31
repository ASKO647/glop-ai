import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Camera, Home, MessageCircle, TrendingUp, User, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../constants/theme';
import { ProfileProvider } from '../../context/ProfileContext';

const TAB_BAR_MARGIN = 20;
const TAB_BAR_BOTTOM_MIN = 24;
const TAB_BAR_HEIGHT = 64;

function TabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon color={focused ? colors.background : colors.textTertiary} size={22} />
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
    <ProfileProvider>
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
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} /> }}
        />
        <Tabs.Screen
          name="coach"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={MessageCircle} focused={focused} /> }}
        />
        <Tabs.Screen
          name="scanner"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Camera} focused={focused} /> }}
        />
        <Tabs.Screen
          name="progression"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={TrendingUp} focused={focused} /> }}
        />
        <Tabs.Screen
          name="profil"
          options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} /> }}
        />
        <Tabs.Screen name="meals" options={{ href: null }} />
      </Tabs>
    </ProfileProvider>
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
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accent,
  },
});
