import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from './src/store/auth/AuthContext';
import { LibraryProvider } from './src/store/reading-plan/libraryStore';
import Navigation from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AuthProvider>
          <LibraryProvider>
            <Navigation />
            <StatusBar style="auto" />
          </LibraryProvider>
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
