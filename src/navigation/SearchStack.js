import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { fonts } from '../constants/theme';
import SearchScreen from '../screens/SearchScreen';
import ApiMealDetailScreen from '../screens/ApiMealDetailScreen';

const Stack = createNativeStackNavigator();

export default function SearchStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.primary,
                headerTitleStyle: { fontFamily: fonts.display, fontWeight: '600' },
                headerShadowVisible: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ApiMealDetail" component={ApiMealDetailScreen} options={{ title: '' }} />
        </Stack.Navigator>
    );
}
