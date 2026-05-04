import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default function BodyStatsPage({ formData, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Body Stats</Text>
      <Text style={styles.subtitle}>We need this to calculate your macros</Text>

      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        value={formData.weight}
        onChangeText={(value) => onChange('weight', value)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        value={formData.height}
        onChangeText={(value) => onChange('height', value)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Age"
        value={formData.age}
        onChangeText={(value) => onChange('age', value)}
        keyboardType="numeric"
      />
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
});
