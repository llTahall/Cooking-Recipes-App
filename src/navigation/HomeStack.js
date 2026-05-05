import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { fonts } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';


import ApiMealDetailScreen from '../screens/ApiMealDetailScreen';
import CuisineListScreen from '../screens/CuisineListScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
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
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />

            <Stack.Screen name="ApiMealDetail" component={ApiMealDetailScreen} options={{ title: '' }} />
            <Stack.Screen name="CuisineList" component={CuisineListScreen} options={{ title: '' }} />
        </Stack.Navigator>
    );
}
