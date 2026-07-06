import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/theme';
import TabBar from '../components/common/TabBar';
import { useAuth } from '../store/auth/AuthContext';

// home
import HomeScreen from '../screens/home/HomeScreen';

// auth screens (SOURCE: named exports + callback props → wrapper 필요)
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { MyPageScreen } from '../screens/auth/MyPageScreen';
import { EditProfileScreen } from '../screens/auth/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';
import { DeleteAccountScreen } from '../screens/auth/DeleteAccountScreen';

// reading-plan
import BookSearchScreen from '../screens/reading-plan/BookSearchScreen';
import BookDetailScreen from '../screens/reading-plan/BookDetailScreen';
import MyLibraryScreen from '../screens/reading-plan/MyLibraryScreen';
import ReadingProgressScreen from '../screens/reading-plan/ReadingProgressScreen';
import OneLineReviewScreen from '../screens/reading-plan/OneLineReviewScreen';
import SNSShareScreen from '../screens/reading-plan/SNSShareScreen';

// reading-group
import GroupListScreen from '../screens/reading-group/GroupListScreen';
import CreateGroupScreen from '../screens/reading-group/CreateGroupScreen';
import JoinGroupScreen from '../screens/reading-group/JoinGroupScreen';
import GroupHomeScreen from '../screens/reading-group/GroupHomeScreen';
import InviteScreen from '../screens/reading-group/InviteScreen';
import ProgressShareScreen from '../screens/reading-group/ProgressShareScreen';
import CommentsScreen from '../screens/reading-group/CommentsScreen';
import GroupSettingsScreen from '../screens/reading-group/GroupSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: COLORS.beigeLight },
  headerTintColor: COLORS.deepGreen,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 15 },
  headerBackTitle: '',
  contentStyle: { backgroundColor: COLORS.beigeDark },
};

// SOURCE auth 스크린들은 callback prop 방식이므로 React Navigation props를 변환하는 래퍼 사용
function LoginWrapper({ navigation }: { navigation: any }) {
  return <LoginScreen onNavigateSignUp={() => navigation.navigate('SignUp')} />;
}

function SignUpWrapper({ navigation }: { navigation: any }) {
  return (
    <SignUpScreen
      onBack={() => navigation.goBack()}
      onSignedUp={() => navigation.navigate('Login')}
    />
  );
}

function MyPageWrapper({ navigation }: { navigation: any }) {
  return (
    <MyPageScreen
      onNavigateEditProfile={() => navigation.navigate('EditProfile')}
      onNavigateChangePassword={() => navigation.navigate('ChangePassword')}
      onNavigateDeleteAccount={() => navigation.navigate('DeleteAccount')}
    />
  );
}

function EditProfileWrapper({ navigation }: { navigation: any }) {
  return <EditProfileScreen onBack={() => navigation.goBack()} />;
}

function ChangePasswordWrapper({ navigation }: { navigation: any }) {
  return <ChangePasswordScreen onBack={() => navigation.goBack()} />;
}

function DeleteAccountWrapper({ navigation }: { navigation: any }) {
  return <DeleteAccountScreen onBack={() => navigation.goBack()} />;
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
    </Stack.Navigator>
  );
}

function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MyLibrary" component={MyLibraryScreen} options={{ title: '내 서재', headerShown: false }} />
      <Stack.Screen name="BookSearch" component={BookSearchScreen} options={{ title: '책 검색' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen as React.ComponentType<any>} options={{ title: '책 상세' }} />
      <Stack.Screen name="ReadingProgress" component={ReadingProgressScreen as React.ComponentType<any>} options={{ title: '독서 진도' }} />
      <Stack.Screen name="OneLineReview" component={OneLineReviewScreen as React.ComponentType<any>} options={{ title: '한줄평' }} />
      <Stack.Screen name="SNSShare" component={SNSShareScreen as React.ComponentType<any>} options={{ title: 'SNS 공유' }} />
    </Stack.Navigator>
  );
}

function GroupStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="GroupList" component={GroupListScreen} options={{ title: '독서모임', headerShown: false }} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: '모임 개설' }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: '모임 참가' }} />
      <Stack.Screen name="GroupHome" component={GroupHomeScreen} options={{ title: '모임 홈' }} />
      <Stack.Screen name="Invite" component={InviteScreen} options={{ title: '멤버 초대' }} />
      <Stack.Screen name="ProgressShare" component={ProgressShareScreen} options={{ title: '진도 공유' }} />
      <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ title: '모임 설정' }} />
    </Stack.Navigator>
  );
}

function MyPageStack() {
  return (
    <Stack.Navigator screenOptions={{ ...stackOptions, headerShown: false }}>
      <Stack.Screen name="MyPage" component={MyPageWrapper} />
      <Stack.Screen name="EditProfile" component={EditProfileWrapper} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordWrapper} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountWrapper} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="LibraryTab" component={LibraryStack} />
      <Tab.Screen name="GroupTab" component={GroupStack} />
      <Tab.Screen name="MyPageTab" component={MyPageStack} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.beigeLight }}>
        <ActivityIndicator color={COLORS.deepGreen} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginWrapper} />
          <Stack.Screen name="SignUp" component={SignUpWrapper} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Comments"
            component={CommentsScreen}
            options={{ ...stackOptions, headerShown: true, title: '공유 책 댓글' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
