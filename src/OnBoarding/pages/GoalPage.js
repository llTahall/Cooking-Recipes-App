import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

const GOALS = [
  { key: 'lose', label: 'Lose Weight', icon: '📉' },
  { key: 'maintain', label: 'Maintain', icon: '⚖️' },
  { key: 'gain', label: 'Gain Weight', icon: '📈' },
];

export default function GoalPage({ value, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Goal</Text>
      <Text style={styles.subtitle}>What do you want to achieve ?</Text>

      {GOALS.map((goal) => (
        <TouchableOpacity
          key={goal.key}
          style={[styles.option, value === goal.key && styles.selected]}
          onPress={() => onChange(goal.key)}
        >
          <Text style={styles.icon}>{goal.icon}</Text>
          <Text style={[styles.label, value === goal.key && styles.selectedText]}>
            {goal.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.subtitle, marginBottom: 32 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 12,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  icon: { fontSize: 24, marginRight: 12 },
  label: { fontSize: 16, fontWeight: '600', color: colors.subtitle },
  selectedText: { color: colors.primary },
});
