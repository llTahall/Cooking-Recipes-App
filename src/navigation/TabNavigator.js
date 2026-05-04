import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../constants/colors';
import HomeStack from './HomeStack';
import SearchStack from './SearchStack';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = [
    { name: 'HomeTab', component: HomeStack, label: 'Home', icon: '🏠' },
    { name: 'SearchTab', component: SearchStack, label: 'Discover', icon: '🔍' },
    { name: 'PlannerTab', component: MealPlannerScreen, label: 'Planner', icon: '📅' },
    { name: 'ProfileTab', component: ProfileScreen, label: 'Profile', icon: '👤' },
];

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 64,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textLight,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
                tabBarIcon: ({ focused }) => {
                    const tab = TABS.find(t => t.name === route.name);
                    return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{tab?.icon}</Text>;
                },
            })}
        >
            {TABS.map(tab => (
                <Tab.Screen
                    key={tab.name}
                    name={tab.name}
                    component={tab.component}
                    options={{ tabBarLabel: tab.label }}
                />
            ))}
        </Tab.Navigator>
    );
}
