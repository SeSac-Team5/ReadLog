import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/store/auth/AuthContext';
import Navigation from './src/navigation';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AuthProvider>
          <Navigation />
          <StatusBar style="auto" />
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
