import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../OnBoarding/OnBoardingScreen';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasOnboarded, setHasOnboarded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('onboarded').then(value => {
            setHasOnboarded(value === 'true'); // TESTER ON BOARDING SET TO FALSE
            setIsLoading(false);
        });
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
