import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { colors } from '../constants/colors';

export const BackButton = ({ currentPage, onboardingRef }) => {
    console.log('currentPage:', currentPage);
    if (currentPage === 0) return <View style={{ width: 80 }} />;
    return (
        <Pressable
            style={[styles.backBtn]}
            onPress={() => onboardingRef.current?.goToPage(currentPage - 1, true)}
        >
            <Text style={styles.backText}>← Back</Text>
        </Pressable>
    );
};



export const NextButton = ({ onPress }) => (
    <Pressable style={styles.nextBtn} onPress={onPress}>
        <Text style={styles.nextText}>Next →</Text>
    </Pressable>
);

export const DoneButton = ({ onPress }) => (
    <Pressable style={styles.nextBtn} onPress={onPress}>
        <Text style={styles.nextText}>Get Started</Text>
    </Pressable>
);


const styles = StyleSheet.create({
    backBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backText: {
        color: colors.subtitle,
        fontSize: 15,
        fontWeight: '600',
    },
    nextBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        marginRight: 8,
    },
    nextText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
