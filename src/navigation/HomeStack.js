import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, } from '../constants/colors';
import { fonts } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import AddRecipeScreen from '../screens/AddRecipeScreen';
import EditRecipeScreen from '../screens/EditRecipeScreen';

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
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'RecipeBox' }} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: '' }} />
            <Stack.Screen name="AddRecipe" component={AddRecipeScreen} options={{ title: 'New Recipe' }} />
            <Stack.Screen name="EditRecipe" component={EditRecipeScreen} options={{ title: 'Edit Recipe' }} />
        </Stack.Navigator>
    );
}
