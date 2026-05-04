import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Logo from '../../assets/logo.svg';
import { colors } from '../../constants/colors';

const WelcomeImage = () => (
    <View style={styles.imageContainer}>
        <Logo width={200} height={200} />
    </View>
);

export const WelcomePage = {
    backgroundColor: colors.background,
    image: <WelcomeImage />,
    title: 'Welcome to NutriFlow',
    subtitle: 'Discover healthy recipes, track your daily\nnutrition and plan your meals for the week.',
};

const styles = StyleSheet.create({
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',

    },
});
