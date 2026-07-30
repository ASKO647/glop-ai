import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="questionnaire" />
      <Stack.Screen name="analyse" />
      <Stack.Screen name="plan" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}
