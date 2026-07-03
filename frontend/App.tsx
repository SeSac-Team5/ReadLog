import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/store/auth/AuthContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
