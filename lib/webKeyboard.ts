import { Platform, type NativeSyntheticEvent, type TextInputKeyPressEventData } from 'react-native';

/**
 * Web-only "Enter sends, Shift+Enter inserts a newline" handler for a multiline `TextInput`'s
 * `onKeyPress`. `undefined` on native, where Enter on a multiline field should just add a
 * newline — RN's typed `onKeyPress` doesn't carry `shiftKey`, but react-native-web forwards the
 * real DOM `KeyboardEvent` as `nativeEvent`, which does.
 */
export function createEnterToSendHandler(onSend: () => void) {
  if (Platform.OS !== 'web') return undefined;
  return (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const shiftKey = (event.nativeEvent as unknown as { shiftKey?: boolean }).shiftKey;
    if (event.nativeEvent.key === 'Enter' && !shiftKey) {
      event.preventDefault();
      onSend();
    }
  };
}
