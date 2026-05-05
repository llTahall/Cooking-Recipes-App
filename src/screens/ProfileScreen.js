import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, Pressable, StyleSheet,
    Modal, TextInput, Alert, Image, KeyboardAvoidingView,
    Platform, SafeAreaView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { colors } from '../constants/colors';
import { updateProfile, setResults } from '../store/slices/profileSlice';
import { addMealLog } from '../store/slices/dailyLogSlice';
import { calculateMacros } from '../OnBoarding/pages/ResultsPage';

const ACTIVITY_LABELS = {
    sedentary: 'Sedentary',
    light: 'Lightly active',
    moderate: 'Moderately active',
    active: 'Very active',
    extra: 'Extra active',
};
const GOAL_LABELS = { lose: 'Lose weight', maintain: 'Maintain', gain: 'Gain muscle' };
const GOAL_COLORS = { lose: '#EF5350', maintain: colors.primary, gain: colors.secondary };
const BMI_CATEGORIES = [
    { range: '< 18.5', label: 'Underweight', color: colors.secondary, desc: 'Your weight is below the healthy range. This can affect energy levels and immune function. Consider increasing caloric intake with nutrient-dense foods.' },
    { range: '18.5 – 24.9', label: 'Normal', color: colors.primary, desc: 'Your weight is in the healthy range. Keep maintaining a balanced diet and regular physical activity to stay here.' },
    { range: '25 – 29.9', label: 'Overweight', color: '#FFB74D', desc: 'Slightly above the healthy range. Small lifestyle changes like reducing processed foods and adding moderate exercise can help.' },
    { range: '≥ 30', label: 'Obese', color: colors.error, desc: 'Associated with higher risk of health conditions. Consulting a healthcare professional for a personalized plan is recommended.' },
];

function getBmiCategory(bmi) {
    const v = parseFloat(bmi);
    if (v < 18.5) return { label: 'Underweight', color: colors.secondary };
    if (v < 25) return { label: 'Normal', color: colors.primary };
    if (v < 30) return { label: 'Overweight', color: '#FFB74D' };
    return { label: 'Obese', color: colors.error };
}
function getBmiPercent(bmi) {
    const v = Math.min(Math.max(parseFloat(bmi) || 0, 10), 40);
    return ((v - 10) / 30) * 100;
}
function getInitials(first, last) {
    return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?';
}

const FIELD_RULES = {
    weight: { label: 'Weight (kg)', min: 30, max: 300, placeholder: 'e.g. 70' },
    height: { label: 'Height (cm)', min: 100, max: 250, placeholder: 'e.g. 175' },
    age: { label: 'Age', min: 10, max: 100, placeholder: 'e.g. 25' },
};

function ProgressBar({ consumed, target, color }) {
    const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
    return (
        <View style={pb.track}>
            <View style={[pb.fill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
    );
}
const pb = StyleSheet.create({
    track: { height: 8, borderRadius: 4, backgroundColor: '#F0F0F0', overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4 },
});

export default function ProfileScreen({ navigation }) {
    const dispatch = useDispatch();
    const profile = useSelector(s => s.profile);
    const results = profile.results;
    const dailyLog = useSelector(s => s.dailyLog);
    const localRecipes = useSelector(s => s.recipes.localRecipes);

    const [avatarUri, setAvatarUri] = useState(null);
    const [editVisible, setEditVisible] = useState(false);
    const [bmiInfoVisible, setBmiInfoVisible] = useState(false);
    const [dailyVisible, setDailyVisible] = useState(false);
    const [logVisible, setLogVisible] = useState(false);
    const [logForm, setLogForm] = useState({ calories: '', protein: '', carbs: '', fat: '' });
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);


    useEffect(() => {
        AsyncStorage.getItem('avatarUri').then(uri => { if (uri) setAvatarUri(uri); });
    }, []);

    async function submitLog() {
        const cal = parseFloat(logForm.calories) || 0;
        const pro = parseFloat(logForm.protein) || 0;
        const carb = parseFloat(logForm.carbs) || 0;
        const fat = parseFloat(logForm.fat) || 0;
        if (cal === 0 && pro === 0 && carb === 0 && fat === 0) { Alert.alert('Empty log', 'Enter at least one value.'); return; }
        dispatch(addMealLog({ calories: cal, protein: pro, carbs: carb, fat }));
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem('dailyLog', JSON.stringify({
            date: today,
            calories: (dailyLog.calories || 0) + cal,
            protein: (dailyLog.protein || 0) + pro,
            carbs: (dailyLog.carbs || 0) + carb,
            fat: (dailyLog.fat || 0) + fat,
        }));
        setLogForm({ calories: '', protein: '', carbs: '', fat: '' });
        setLogVisible(false);
    }

    function openEdit() {
        setForm({
            weight: String(profile.weight ?? ''),
            height: String(profile.height ?? ''),
            age: String(profile.age ?? ''),
            sex: profile.sex ?? 'male',
            activity: profile.activity ?? 'moderate',
            goal: profile.goal ?? 'maintain',
        });
        setEditVisible(true);
    }

    async function saveEdit() {
        for (const key of ['weight', 'height', 'age']) {
            const val = parseFloat(form[key]);
            const rule = FIELD_RULES[key];
            if (isNaN(val) || val < rule.min || val > rule.max) {
                Alert.alert('Invalid input', `${rule.label} must be between ${rule.min} and ${rule.max}.`);
                return;
            }
        }
        setSaving(true);
        const updated = { ...profile, ...form };
        dispatch(updateProfile(updated));
        dispatch(setResults(calculateMacros(updated)));
        await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
        setSaving(false);
        setEditVisible(false);
    }

    async function pickAvatar(useCamera) {
        let result;
        if (useCamera) {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) { Alert.alert('Permission required', 'Camera access is needed.'); return; }
            result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        }
        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setAvatarUri(uri);
            await AsyncStorage.setItem('avatarUri', uri);
        }
    }

    function showAvatarOptions() {
        Alert.alert('Profile photo', 'Choose source', [
            { text: 'Camera', onPress: () => pickAvatar(true) },
            { text: 'Gallery', onPress: () => pickAvatar(false) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    }

    async function handleReset() {
        Alert.alert('Reset profile', 'This will clear all your data and restart the onboarding. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset', style: 'destructive', onPress: async () => {
                    await AsyncStorage.multiRemove(['onboarded', 'userProfile', 'avatarUri', 'dailyLog']);
                    Alert.alert('Done', 'Please restart the app to go through onboarding again.');
                }
            },
        ]);
    }

    const bmiCat = results?.bmi ? getBmiCategory(results.bmi) : null;
    const bmiPct = results?.bmi ? getBmiPercent(results.bmi) : 0;
    const goalColor = GOAL_COLORS[profile.goal] ?? colors.primary;
    const MACRO_PROGRESS = results ? [
        { label: 'Calories', consumed: dailyLog.calories || 0, target: results.calories, unit: 'kcal', color: colors.primaryDark },
        { label: 'Protein', consumed: dailyLog.protein || 0, target: results.protein, unit: 'g', color: colors.error },
        { label: 'Carbs', consumed: dailyLog.carbs || 0, target: results.carbs, unit: 'g', color: '#FFB74D' },
        { label: 'Fat', consumed: dailyLog.fat || 0, target: results.fat, unit: 'g', color: colors.secondary },
    ] : [];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={showAvatarOptions} style={styles.avatarWrap}>
                        {avatarUri
                            ? <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitials}>{getInitials(profile.firstName, profile.lastName)}</Text></View>
                        }
                        <View style={styles.cameraIcon}><Text style={styles.cameraText}>+</Text></View>
                    </Pressable>
                    <Text style={styles.name}>
                        {profile.firstName || profile.lastName ? `${profile.firstName} ${profile.lastName}`.trim() : 'My Profile'}
                    </Text>
                    <View style={[styles.goalBadge, { backgroundColor: goalColor + '20', borderColor: goalColor + '50' }]}>
                        <Text style={[styles.goalBadgeText, { color: goalColor }]}>{GOAL_LABELS[profile.goal] ?? 'No goal set'}</Text>
                    </View>
                </View>

                {/* BMI Card */}
                {results?.bmi && (
                    <Pressable onPress={() => setBmiInfoVisible(true)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Body Mass Index</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={[styles.bmiChip, { backgroundColor: bmiCat.color + '20' }]}>
                                    <Text style={[styles.bmiChipText, { color: bmiCat.color }]}>{bmiCat.label}</Text>
                                </View>
                                <Text style={styles.tapHint}>ⓘ</Text>
                            </View>
                        </View>
                        <Text style={[styles.bmiValue, { color: bmiCat.color }]}>{results.bmi}</Text>
                        <View style={styles.gaugeTrack}>
                            <View style={styles.gaugeSegments}>
                                {[{ color: colors.secondary, flex: 28 }, { color: colors.primary, flex: 43 }, { color: '#FFB74D', flex: 17 }, { color: colors.error, flex: 12 }].map((seg, i) => (
                                    <View key={i} style={[styles.gaugeSeg, { flex: seg.flex, backgroundColor: seg.color }]} />
                                ))}
                            </View>
                            <View style={[styles.gaugeNeedle, { left: `${bmiPct}%` }]} />
                        </View>
                        <View style={styles.gaugeLabels}>
                            {['10', '18.5', '25', '30', '40'].map(v => <Text key={v} style={styles.gaugeLabel}>{v}</Text>)}
                        </View>
                    </Pressable>
                )}

                {/* Daily Targets Card */}
                {results && (
                    <Pressable onPress={() => setDailyVisible(true)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Daily Targets</Text>
                            <Text style={styles.tapHint}>Today's progress →</Text>
                        </View>
                        <View style={styles.calorieRow}>
                            <Text style={styles.calorieNumber}>{results.calories}</Text>
                            <Text style={styles.calorieUnit}>kcal / day</Text>
                        </View>
                        <View style={styles.macroRow}>
                            {[
                                { label: 'Protein', value: results.protein, unit: 'g', color: colors.error },
                                { label: 'Carbs', value: results.carbs, unit: 'g', color: '#FFB74D' },
                                { label: 'Fat', value: results.fat, unit: 'g', color: colors.secondary },
                            ].map(m => (
                                <View key={m.label} style={[styles.macroPill, { borderColor: m.color + '40', backgroundColor: m.color + '10' }]}>
                                    <Text style={[styles.macroPillValue, { color: m.color }]}>{m.value}<Text style={styles.macroPillUnit}>{m.unit}</Text></Text>
                                    <Text style={styles.macroPillLabel}>{m.label}</Text>
                                </View>
                            ))}
                        </View>
                    </Pressable>
                )}

                {/* Body Stats */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Body Stats</Text>
                        <Pressable onPress={openEdit} style={styles.editBtn}>
                            <Text style={styles.editBtnText}>Edit</Text>
                        </Pressable>
                    </View>
                    <View style={styles.statsGrid}>
                        {[
                            { label: 'Weight', value: `${profile.weight} kg` },
                            { label: 'Height', value: `${profile.height} cm` },
                            { label: 'Age', value: `${profile.age} yrs` },
                            { label: 'Sex', value: profile.sex === 'male' ? 'Male' : 'Female' },
                        ].map(s => (
                            <View key={s.label} style={styles.statItem}>
                                <Text style={styles.statValue}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.activityRow}>
                        <Text style={styles.activityLabel}>Activity</Text>
                        <Text style={styles.activityValue}>{ACTIVITY_LABELS[profile.activity]}</Text>
                    </View>
                </View>

                {/* Saved Recipes */}
                <Pressable
                    onPress={() => navigation.navigate('SavedRecipes')}
                    style={({ pressed }) => [styles.card, styles.navRow, pressed && { opacity: 0.85 }]}
                >
                    <View>
                        <Text style={styles.navRowTitle}>Saved Recipes</Text>
                        <Text style={styles.navRowSub}>{localRecipes.length} recipe{localRecipes.length !== 1 ? 's' : ''} saved</Text>
                    </View>
                    <Text style={styles.navRowChevron}>›</Text>
                </Pressable>


                {/* Reset */}
                <Pressable onPress={handleReset} style={styles.resetBtn}>
                    <Text style={styles.resetText}>Reset & Restart Onboarding</Text>
                </Pressable>
                <View style={{ height: 100 }} />
            </ScrollView>



            {/* BMI Info Modal */}
            <Modal visible={bmiInfoVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBmiInfoVisible(false)}>
                <SafeAreaView style={styles.modalSafe}>
                    <View style={styles.modalHeader}>
                        <View style={{ width: 60 }} />
                        <Text style={styles.modalTitle}>BMI Guide</Text>
                        <Pressable onPress={() => setBmiInfoVisible(false)} style={{ width: 60, alignItems: 'flex-end' }}>
                            <Text style={styles.modalCancel}>Close</Text>
                        </Pressable>
                    </View>
                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.bmiInfoIntro}>
                            Body Mass Index (BMI) is calculated from your weight and height. It's a screening tool — not a diagnostic measure — but gives a useful snapshot of your weight category.
                        </Text>
                        {BMI_CATEGORIES.map(cat => (
                            <View key={cat.label} style={[styles.bmiInfoCard, { borderLeftColor: cat.color, backgroundColor: cat.color + '0D' }, results?.bmi && getBmiCategory(results.bmi).label === cat.label && styles.bmiInfoCardActive]}>
                                <View style={styles.bmiInfoCardHeader}>
                                    <View style={[styles.bmiInfoDot, { backgroundColor: cat.color }]} />
                                    <Text style={[styles.bmiInfoLabel, { color: cat.color }]}>{cat.label}</Text>
                                    <Text style={styles.bmiInfoRange}>{cat.range}</Text>
                                    {results?.bmi && getBmiCategory(results.bmi).label === cat.label && (
                                        <View style={[styles.youBadge, { backgroundColor: cat.color }]}>
                                            <Text style={styles.youBadgeText}>You</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.bmiInfoDesc}>{cat.desc}</Text>
                            </View>
                        ))}
                        <Text style={styles.bmiDisclaimer}>⚠️ BMI does not account for muscle mass, bone density, or fat distribution. Always consult a healthcare professional for a full assessment.</Text>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Daily Progress Modal */}
            <Modal visible={dailyVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDailyVisible(false)}>
                <SafeAreaView style={styles.modalSafe}>
                    <View style={styles.modalHeader}>
                        <View style={{ width: 60 }} />
                        <Text style={styles.modalTitle}>Today's Progress</Text>
                        <Pressable onPress={() => setDailyVisible(false)} style={{ width: 60, alignItems: 'flex-end' }}>
                            <Text style={styles.modalCancel}>Close</Text>
                        </Pressable>
                    </View>
                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.progressDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                        {MACRO_PROGRESS.map(m => {
                            const pct = m.target > 0 ? Math.min(Math.round((m.consumed / m.target) * 100), 100) : 0;
                            return (
                                <View key={m.label} style={styles.progressItem}>
                                    <View style={styles.progressItemHeader}>
                                        <Text style={styles.progressLabel}>{m.label}</Text>
                                        <Text style={styles.progressValues}>
                                            <Text style={{ color: m.color, fontWeight: '700' }}>{Math.round(m.consumed)}</Text>
                                            <Text style={{ color: colors.subtitle }}> / {m.target}{m.unit}</Text>
                                        </Text>
                                        <Text style={[styles.progressPct, { color: pct >= 100 ? colors.primary : colors.subtitle }]}>{pct}%</Text>
                                    </View>
                                    <ProgressBar consumed={m.consumed} target={m.target} color={m.color} />
                                </View>
                            );
                        })}
                        <Pressable onPress={() => { setDailyVisible(false); setTimeout(() => setLogVisible(true), 300); }} style={styles.logMealBtn}>
                            <Text style={styles.logMealBtnText}>+ Log a Meal</Text>
                        </Pressable>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Log Meal Modal */}
            <Modal visible={logVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLogVisible(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <SafeAreaView style={styles.modalSafe}>
                        <View style={styles.modalHeader}>
                            <Pressable onPress={() => setLogVisible(false)}><Text style={styles.modalCancel}>Cancel</Text></Pressable>
                            <Text style={styles.modalTitle}>Log a Meal</Text>
                            <Pressable onPress={submitLog}><Text style={styles.modalSave}>Save</Text></Pressable>
                        </View>
                        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                            {[{ key: 'calories', label: 'Calories (kcal)' }, { key: 'protein', label: 'Protein (g)' }, { key: 'carbs', label: 'Carbs (g)' }, { key: 'fat', label: 'Fat (g)' }].map(f => (
                                <View key={f.key} style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{f.label}</Text>
                                    <TextInput style={styles.input} value={logForm[f.key]} onChangeText={v => setLogForm(p => ({ ...p, [f.key]: v }))} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.subtitle} />
                                </View>
                            ))}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <SafeAreaView style={styles.modalSafe}>
                        <View style={styles.modalHeader}>
                            <Pressable onPress={() => setEditVisible(false)}><Text style={styles.modalCancel}>Cancel</Text></Pressable>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <Pressable onPress={saveEdit} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.modalSave}>Save</Text>}
                            </Pressable>
                        </View>
                        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                            {Object.entries(FIELD_RULES).map(([key, rule]) => (
                                <View key={key} style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{rule.label}</Text>
                                    <TextInput style={styles.input} value={form[key]} onChangeText={v => setForm(f => ({ ...f, [key]: v }))} keyboardType="numeric" placeholder={rule.placeholder} placeholderTextColor={colors.subtitle} />
                                </View>
                            ))}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Sex</Text>
                                <View style={styles.toggleRow}>
                                    {['male', 'female'].map(v => (
                                        <Pressable key={v} onPress={() => setForm(f => ({ ...f, sex: v }))} style={[styles.toggleBtn, form.sex === v && styles.toggleBtnActive]}>
                                            <Text style={[styles.toggleText, form.sex === v && styles.toggleTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Activity level</Text>
                                {Object.entries(ACTIVITY_LABELS).map(([k, label]) => (
                                    <Pressable key={k} onPress={() => setForm(f => ({ ...f, activity: k }))} style={[styles.optionRow, form.activity === k && styles.optionRowActive]}>
                                        <View style={[styles.optionDot, form.activity === k && styles.optionDotActive]} />
                                        <Text style={[styles.optionText, form.activity === k && styles.optionTextActive]}>{label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Goal</Text>
                                <View style={styles.toggleRow}>
                                    {Object.entries(GOAL_LABELS).map(([k, label]) => (
                                        <Pressable key={k} onPress={() => setForm(f => ({ ...f, goal: k }))} style={[styles.toggleBtn, form.goal === k && styles.toggleBtnActive]}>
                                            <Text style={[styles.toggleText, form.goal === k && styles.toggleTextActive]}>{label}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F7F5' },
    scroll: { flex: 1 },
    content: { paddingTop: 24, paddingHorizontal: 20 },

    header: { alignItems: 'center', marginBottom: 24 },
    avatarWrap: { position: 'relative', marginBottom: 14 },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.primaryLight },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary + '40' },
    avatarInitials: { fontSize: 32, fontWeight: '700', color: colors.primaryDark },
    cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F5F7F5' },
    cameraText: { color: '#fff', fontSize: 16, lineHeight: 20 },
    name: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
    goalBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    goalBadgeText: { fontSize: 13, fontWeight: '600' },

    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#455A64', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 14, fontWeight: '600', color: colors.subtitle, letterSpacing: 0.5, textTransform: 'uppercase' },
    tapHint: { fontSize: 13, color: colors.subtitle },

    bmiChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    bmiChipText: { fontSize: 13, fontWeight: '700' },
    bmiValue: { fontSize: 52, fontWeight: '800', letterSpacing: -1, marginBottom: 16 },
    gaugeTrack: { height: 10, borderRadius: 6, overflow: 'visible', marginBottom: 6, position: 'relative' },
    gaugeSegments: { flexDirection: 'row', height: 10, borderRadius: 6, overflow: 'hidden' },
    gaugeSeg: { height: 10 },
    gaugeNeedle: { position: 'absolute', top: -5, width: 4, height: 20, borderRadius: 2, backgroundColor: colors.text, marginLeft: -2 },
    gaugeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    gaugeLabel: { fontSize: 10, color: colors.subtitle },

    calorieRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
    calorieNumber: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    calorieUnit: { fontSize: 14, color: colors.subtitle, marginLeft: 6 },
    macroRow: { flexDirection: 'row', gap: 10 },
    macroPill: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
    macroPillValue: { fontSize: 18, fontWeight: '700' },
    macroPillUnit: { fontSize: 12, fontWeight: '400' },
    macroPillLabel: { fontSize: 11, color: colors.subtitle, marginTop: 2 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statItem: { flex: 1, minWidth: '40%', backgroundColor: '#F5F7F5', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
    statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 12, color: colors.subtitle, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
    activityRow: { flexDirection: 'row', justifyContent: 'space-between' },
    activityLabel: { fontSize: 14, color: colors.subtitle },
    activityValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    editBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.primaryLight },
    editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },


    resetBtn: { alignItems: 'center', paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.error + '40', backgroundColor: colors.error + '08', marginBottom: 8 },
    resetText: { fontSize: 14, fontWeight: '600', color: colors.error },

    modalSafe: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    modalCancel: { fontSize: 15, color: colors.subtitle },
    modalSave: { fontSize: 15, fontWeight: '700', color: colors.primary },
    modalBody: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    bmiInfoIntro: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 20 },
    bmiInfoCard: { borderLeftWidth: 4, borderRadius: 12, padding: 14, marginBottom: 12 },
    bmiInfoCardActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    bmiInfoCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    bmiInfoDot: { width: 10, height: 10, borderRadius: 5 },
    bmiInfoLabel: { fontSize: 15, fontWeight: '700' },
    bmiInfoRange: { fontSize: 13, color: colors.subtitle, marginLeft: 'auto' },
    youBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    youBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    bmiInfoDesc: { fontSize: 13, color: colors.text, lineHeight: 20 },
    bmiDisclaimer: { fontSize: 12, color: colors.subtitle, lineHeight: 18, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginTop: 8 },

    progressDate: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 20 },
    progressItem: { marginBottom: 20 },
    progressItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    progressLabel: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
    progressValues: { fontSize: 14 },
    progressPct: { fontSize: 13, fontWeight: '600', minWidth: 36, textAlign: 'right' },
    logMealBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    logMealBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.subtitle, marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase' },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, color: colors.text, backgroundColor: '#FAFAFA' },
    toggleRow: { flexDirection: 'row', gap: 10 },
    toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: '#FAFAFA' },
    toggleBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    toggleText: { fontSize: 14, fontWeight: '500', color: colors.subtitle },
    toggleTextActive: { color: colors.primaryDark, fontWeight: '700' },
    optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: colors.border },
    optionRowActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    optionDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.subtitle, marginRight: 10 },
    optionDotActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
    optionText: { fontSize: 14, color: colors.subtitle },
    optionTextActive: { color: colors.primaryDark, fontWeight: '600' },

    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
    navRowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    navRowSub: { fontSize: 13, color: colors.subtitle, marginTop: 3 },
    navRowChevron: { fontSize: 26, color: colors.subtitle },

});
