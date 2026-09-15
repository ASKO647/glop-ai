import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { hasCompletedOnboardingQuestionnaire } from '../../constants/profile';
import { useAuth } from '../../context/AuthContext';
import { OnboardingProvider } from '../../context/OnboardingContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';

export default function OnboardingLayout() {
  const { session, isSubscribed } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // A session with isSubscribed === false only happens once the root layout has already
  // resolved loading, so this can only be true when there IS a session — e.g. a Google
  // sign-in that never went through the questionnaire. `initialRouteName` below is only read
  // once, on mount, so wait for the profile to resolve first rather than flashing the wrong
  // first screen (the paywall for a brand-new account that still needs `/q/0`, or vice versa).
  const stillResolving = !!session && isSubscribed === false && profileLoading;
  if (stillResolving) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const needsOnboarding = !!session && isSubscribed === false && !hasCompletedOnboardingQuestionnaire(profile);
  const initialRouteName = needsOnboarding ? 'q/[step]' : isSubscribed === false ? 'paywall' : 'welcome';

  return (
    <OnboardingProvider>
      <Stack
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="q/[step]" options={{ animation: 'none' }} />
        <Stack.Screen name="analyse" />
        <Stack.Screen name="plan" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="paywall" />
      </Stack>
    </OnboardingProvider>
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
