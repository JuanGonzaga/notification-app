import { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BirthdayReminderScreen } from './screens/BirthdayReminderScreen';
import { ensurePermissionsAndChannel } from './services/notificationsService';

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ensurePermissionsAndChannel();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <BirthdayReminderScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
