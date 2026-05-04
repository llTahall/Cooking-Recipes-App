import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default function PersonalInfoPage({ formData, onChange }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Personal Info</Text>
            <Text style={styles.subtitle}>Tell us about yourself</Text>

            <TextInput
                style={styles.input}
                placeholder="First Name"
                value={formData.firstName} 
                onChangeText={(value) => onChange('firstName', value)}
            />

            <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={formData.lastName}
                onChangeText={(value) => onChange('lastName', value)}
            />

            <Text style={styles.label}>Sex</Text>
            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.option, formData.sex === 'male' && styles.selected]}
                    onPress={() => onChange('sex', 'male')}
                >
                    <Text style={[styles.optionText, formData.sex === 'male' && styles.selectedText]}>
                        Male
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.option, formData.sex === 'female' && styles.selected]}
                    onPress={() => onChange('sex', 'female')}
                >
                    <Text style={[styles.optionText, formData.sex === 'female' && styles.selectedText]}>
                        Female
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', paddingHorizontal: 24 },
    title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: colors.subtitle, marginBottom: 32 },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: colors.text,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    label: { fontSize: 14, color: colors.subtitle, marginBottom: 10 },
    row: { flexDirection: 'row', gap: 12 },
    option: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
    },
    selected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
    optionText: { fontSize: 15, color: colors.subtitle, fontWeight: '600' },
    selectedText: { color: colors.primary },
});
