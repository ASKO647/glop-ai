import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LocaleProvider } from '../context/LocaleContext';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function RootNavigator() {
  const { session, isSubscribed, loading } = useAuth();
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statusBar = <StatusBar style={resolvedScheme === 'light' ? 'dark' : 'light'} />;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        {statusBar}
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // No session → onboarding (starts at welcome). Session but not subscribed → onboarding,
  // (onboarding)/_layout.tsx opens straight to paywall in that case. Session + subscribed → tabs.
  const showTabs = !!session && !!isSubscribed;

  return (
    // Wraps the whole navigator (not just (tabs)) so screens declared as siblings —
    // legal/* — can also read the profile via useProfile().
    <ProfileProvider>
      {statusBar}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!showTabs}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={showTabs}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/[id]" />
          <Stack.Screen name="workout/session/[id]" />
          <Stack.Screen name="journal" />
          <Stack.Screen name="fasting" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="badges" />
          <Stack.Screen name="recipes" />
          <Stack.Screen name="recipe/[id]" />
          <Stack.Screen name="groups" />
          <Stack.Screen name="group/[id]" />
          <Stack.Screen name="group/[id]/info" />
          <Stack.Screen name="skincare" />
          <Stack.Screen name="legal/terms" />
          <Stack.Screen name="legal/privacy" />
        </Stack.Protected>
      </Stack>
    </ProfileProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocaleProvider>
            <ThemeProvider>
              <RootNavigator />
            </ThemeProvider>
          </LocaleProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    loadingScreen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
