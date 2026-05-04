import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    extra: 1.9,
};

const GOAL_ADJUSTMENTS = {
    lose: -400,
    maintain: 0,
    gain: 400,
};

export const calculateMacros = (formData) => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age);

    if (!weight || !height || !age) return null;

    const bmr = formData.sex === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const tdee = bmr * ACTIVITY_MULTIPLIERS[formData.activity];
    const calories = tdee + GOAL_ADJUSTMENTS[formData.goal];
    const protein = weight * 2.2;
    const fat = (calories * 0.25) / 9;
    const carbs = (calories - protein * 4 - fat * 9) / 4;
    const bmi = weight / ((height / 100) ** 2);

    return {
        bmi: bmi.toFixed(1),
        calories: Math.round(calories),
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
    };
};

export default function ResultsPage({ formData }) {

    const results = calculateMacros(formData);

    if (!results) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Your Results</Text>
                <Text style={styles.subtitle}>Please fill in your body stats first.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Results</Text>
            <Text style={styles.subtitle}>Based on your profile</Text>

            <View style={styles.bmiCard}>
                <Text style={styles.bmiValue}>{results.bmi}</Text>
                <Text style={styles.bmiLabel}>BMI</Text>
            </View>

            <View style={styles.grid}>
                {[
                    { label: 'Calories', value: results.calories, unit: 'kcal' },
                    { label: 'Protein', value: results.protein, unit: 'g' },
                    { label: 'Carbs', value: results.carbs, unit: 'g' },
                    { label: 'Fat', value: results.fat, unit: 'g' },
                ].map((item) => (
                    <View key={item.label} style={styles.macroCard}>
                        <Text style={styles.macroValue}>{item.value}<Text style={styles.macroUnit}>{item.unit}</Text></Text>
                        <Text style={styles.macroLabel}>{item.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', paddingHorizontal: 24 },
    title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: colors.subtitle, marginBottom: 24 },
    bmiCard: {
        backgroundColor: colors.primary + '20',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    bmiValue: { fontSize: 48, fontWeight: '700', color: colors.primary },
    bmiLabel: { fontSize: 14, color: colors.subtitle, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    macroCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: colors.secondary + '15',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    macroValue: { fontSize: 24, fontWeight: '700', color: colors.text },
    macroUnit: { fontSize: 14, fontWeight: '400', color: colors.subtitle },
    macroLabel: { fontSize: 13, color: colors.subtitle, marginTop: 4 },
});
