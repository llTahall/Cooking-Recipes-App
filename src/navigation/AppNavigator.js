import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { colors } from '../constants/colors';
import { updateProfile, setResults } from '../store/slices/profileSlice';
import { setWeek } from '../store/slices/plannerSlice';
import { setLocalRecipes } from '../store/slices/recipesSlice';
import { calculateMacros } from '../OnBoarding/pages/ResultsPage';
import { initDatabase, getMealPlan, getAllRecipes } from '../services/database';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../OnBoarding/OnBoardingScreen';

const Stack = createNativeStackNavigator();
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AppNavigator() {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [hasOnboarded, setHasOnboarded] = useState(false);

    useEffect(() => {
        async function bootstrap() {
            await initDatabase();

            const onboarded = await AsyncStorage.getItem('onboarded');
            if (onboarded === 'true') {
                const raw = await AsyncStorage.getItem('userProfile');
                if (raw) {
                    const profile = JSON.parse(raw);
                    dispatch(updateProfile(profile));
                    dispatch(setResults(calculateMacros(profile)));
                }
                try {
                    const rows = await getMealPlan();
                    const week = Object.fromEntries(DAYS.map(d => [d, []]));
                    rows.forEach(meal => {
                        if (week[meal.day]) week[meal.day].push(meal);
                    });
                    dispatch(setWeek(week));
                } catch (e) { console.error('planner load error', e); }

                try {
                    const recipes = await getAllRecipes();
                    dispatch(setLocalRecipes(recipes));
                } catch (e) { console.error('recipes load error', e); }
            }
            setHasOnboarded(onboarded === 'true');
            setIsLoading(false);
        }
        bootstrap();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!hasOnboarded ? (
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                ) : (
                    <Stack.Screen name="MainApp" component={TabNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
