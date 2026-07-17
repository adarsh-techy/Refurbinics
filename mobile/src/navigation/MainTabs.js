import { Image, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ServiceScreen from '../screens/ServiceScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Service: '🔧',
  Dashboard: '📊',
  History: '🕘',
  Profile: '👤',
};

// Fully custom header (rather than relying on headerStyle's border, which
// react-navigation doesn't reliably render on the web target) so the green
// border is guaranteed to show on every platform.
function Header() {
  return (
    <View
      style={{
        height: 92,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingLeft: 14,
        paddingBottom: 10,
        backgroundColor: '#040509',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#14532d',
      }}
    >
      {/* Cropped tight to the logo's wordmark (the source PNG has a lot of
          empty canvas above/below/around it) so it reads as large and sits
          flush left instead of "contain" centering a small image in a
          mismatched box. */}
      <View style={{ width: 124, height: 21, overflow: 'hidden' }}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 134, height: 90, marginTop: -31, marginLeft: -4 }}
        />
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <Header />,
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          backgroundColor: '#040509',
          borderTopColor: 'rgba(30, 64, 175, 0.4)',
        },
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Service" component={ServiceScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
