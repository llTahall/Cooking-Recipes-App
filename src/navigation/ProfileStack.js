import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import ProfileScreen from '../screens/ProfileScreen';
import SavedRecipesScreen from '../screens/SavedRecipesScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="SavedRecipes" component={SavedRecipesScreen} />
        </Stack.Navigator>
    );
}
