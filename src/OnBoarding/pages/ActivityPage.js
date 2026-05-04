import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';

const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
  { key: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
  { key: 'active', label: 'Very Active', desc: '6-7 days/week' },
  { key: 'extra', label: 'Extra Active', desc: 'Physical job or 2x training' },
];

export default function ActivityPage({ value, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Level</Text>
      <Text style={styles.subtitle}>How active are you per week ?</Text>

      {ACTIVITIES.map((activity) => (
        <TouchableOpacity
          key={activity.key}
          style={[styles.option, value === activity.key && styles.selected]}
          onPress={() => onChange(activity.key)}
        >
          <Text style={[styles.label, value === activity.key && styles.selectedText]}>
            {activity.label}
          </Text>
          <Text style={styles.desc}>{activity.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.subtitle, marginBottom: 24 },
  option: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 10,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  label: { fontSize: 15, fontWeight: '600', color: colors.subtitle },
  selectedText: { color: colors.primary },
  desc: { fontSize: 12, color: colors.subtitle, marginTop: 2 },
});
