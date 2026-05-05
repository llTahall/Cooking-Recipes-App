import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, FlatList, Pressable,
    StyleSheet, ActivityIndicator, Modal, TextInput,
    KeyboardAvoidingView, Platform, Image, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { colors } from '../constants/colors';
import { fetchByAreas } from '../services/api';
import { loadLog, addMealLog, resetLog } from '../store/slices/dailyLogSlice';

const EASTERN_AREAS = [
    'Moroccan', 'Egyptian', 'Tunisian', 'Turkish',
    'Chinese', 'Japanese', 'Indian', 'Thai',
    'Vietnamese', 'Filipino', 'Malaysian',
];
const WESTERN_AREAS = [
    'American', 'British', 'French', 'Italian',
    'Mexican', 'Spanish', 'Greek', 'Portuguese',
    'Canadian', 'Irish', 'Dutch', 'Polish',
    'Croatian', 'Russian', 'Jamaican', 'Kenyan',
];

const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const CARD_WIDTH = 150;

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

function getBmiColor(category) {
    if (!category) return colors.subtitle;
    const c = category.toLowerCase();
    if (c.includes('normal')) return colors.primary;
    if (c.includes('under')) return colors.secondary;
    return colors.error;
}

function getMealTypeColor(type) {
    const t = (type || '').toLowerCase();
    if (t === 'breakfast') return '#FFB74D';
    if (t === 'lunch') return colors.secondary;
    if (t === 'dinner') return colors.primaryDark;
    if (t === 'snack') return '#AB47BC';
    return colors.primary;
}

function MacroBar({ label, consumed, target, color }) {
    const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
    return (
        <View style={styles.macroBarContainer}>
            <View style={styles.macroBarHeader}>
                <Text style={styles.macroLabel}>{label}</Text>
                <Text style={styles.macroValue}>
                    {Math.round(consumed)}<Text style={styles.macroTarget}>/{target}g</Text>
                </Text>
            </View>
            <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

function SuggestionCard({ item, onPress }) {
    return (
        <Pressable style={styles.suggCard} onPress={onPress}>
            <Image source={{ uri: item.strMealThumb }} style={styles.suggImage} />
            <View style={styles.suggInfo}>
                <Text style={styles.suggName} numberOfLines={2}>{item.strMeal}</Text>
            </View>
        </Pressable>
    );
}

export default function HomeScreen({ navigation }) {
    const dispatch = useDispatch();
    const profile = useSelector(s => s.profile);
    const dailyLog = useSelector(s => s.dailyLog);
    const results = profile.results;

    const todayKey = WEEK_DAYS[new Date().getDay()];
    const todayPlan = useSelector(s => s.planner.week[todayKey] ?? []);

    const [easternMeals, setEasternMeals] = useState([]);
    const [westernMeals, setWesternMeals] = useState([]);
    const [loadingEastern, setLoadingEastern] = useState(false);
    const [loadingWestern, setLoadingWestern] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [logForm, setLogForm] = useState({ calories: '', protein: '', carbs: '', fat: '' });
    const [logError, setLogError] = useState('');

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        AsyncStorage.getItem('dailyLog').then(raw => {
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved.date === today) dispatch(loadLog(saved));
            else { dispatch(resetLog()); AsyncStorage.removeItem('dailyLog'); }
        });
    }, []);

    useEffect(() => {
        setLoadingEastern(true);
        fetchByAreas(EASTERN_AREAS)
            .then(setEasternMeals)
            .catch(() => { })
            .finally(() => setLoadingEastern(false));
    }, []);

    useEffect(() => {
        setLoadingWestern(true);
        fetchByAreas(WESTERN_AREAS)
            .then(setWesternMeals)
            .catch(() => { })
            .finally(() => setLoadingWestern(false));
    }, []);

    const handleLogSubmit = useCallback(async () => {
        const calories = parseFloat(logForm.calories);
        if (!calories || isNaN(calories)) {
            setLogError('Enter at least the calories');
            return;
        }
        const entry = {
            calories,
            protein: parseFloat(logForm.protein) || 0,
            carbs: parseFloat(logForm.carbs) || 0,
            fat: parseFloat(logForm.fat) || 0,
        };
        dispatch(addMealLog(entry));
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem('dailyLog', JSON.stringify({
            date: today,
            calories: dailyLog.calories + entry.calories,
            protein: dailyLog.protein + entry.protein,
            carbs: dailyLog.carbs + entry.carbs,
            fat: dailyLog.fat + entry.fat,
        }));
        setLogForm({ calories: '', protein: '', carbs: '', fat: '' });
        setLogError('');
        setShowLogModal(false);
    }, [logForm, dailyLog]);

    const calPct = results?.calories > 0
        ? Math.min((dailyLog.calories / results.calories) * 100, 100)
        : 0;

    const renderSuggestion = ({ item, index }) => (
        <SuggestionCard
            item={item}
            onPress={() => navigation.navigate('ApiMealDetail', { id: item.idMeal })}
        />
    );

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>{getGreeting()}, {profile.firstName || 'there'}</Text>
                    <Text style={styles.subGreeting}>Track your daily nutrition</Text>
                </View>

                {/* Daily Goals */}
                {results && (
                    <View style={styles.nutritionCard}>
                        <View style={styles.nutritionCardTop}>
                            <Text style={styles.nutritionTitle}>Daily Goals</Text>
                            <View style={[styles.bmiChip, { backgroundColor: getBmiColor(results.bmiCategory) + '20' }]}>
                                <Text style={[styles.bmiText, { color: getBmiColor(results.bmiCategory) }]}>
                                    BMI {results.bmi} · {results.bmiCategory}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.caloriesRow}>
                            <Text style={styles.caloriesConsumed}>{Math.round(dailyLog.calories)}</Text>
                            <Text style={styles.caloriesTarget}>/ {results.calories} kcal</Text>
                        </View>
                        <View style={styles.caloriesTrack}>
                            <View style={[styles.caloriesFill, { width: `${calPct}%` }]} />
                        </View>
                        <View style={styles.macrosRow}>
                            <MacroBar label="Protein" consumed={dailyLog.protein} target={results.protein} color={colors.primary} />
                            <MacroBar label="Carbs" consumed={dailyLog.carbs} target={results.carbs} color={colors.secondary} />
                            <MacroBar label="Fat" consumed={dailyLog.fat} target={results.fat} color="#FFB74D" />
                        </View>
                        <Pressable style={styles.logBtn} onPress={() => setShowLogModal(true)}>
                            <Text style={styles.logBtnText}>+ Log a Meal</Text>
                        </Pressable>
                    </View>
                )}

                {/* Today's Plan */}
                <View style={styles.todayPlanCard}>
                    <View style={styles.todayPlanCardHeader}>
                        <View>
                            <Text style={styles.todayPlanCardTitle}>Today's Plan</Text>
                            <Text style={styles.todayPlanCardDate}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                        <Pressable onPress={() => navigation.navigate('PlannerTab')} style={styles.todayPlanEditBtn}>
                            <Text style={styles.todayPlanEditText}>View Details</Text>
                        </Pressable>
                    </View>

                    {todayPlan.length === 0 ? (
                        <Pressable onPress={() => navigation.navigate('PlannerTab')} style={styles.todayPlanEmpty}>
                            <Text style={styles.todayPlanEmptyText}>No meals planned — tap to add</Text>
                        </Pressable>
                    ) : (
                        todayPlan.map((meal, idx) => (
                            <View
                                key={String(meal.id)}
                                style={[styles.todayPlanRow, idx < todayPlan.length - 1 && styles.todayPlanRowBorder]}
                            >
                                <View style={[styles.todayPlanDot, { backgroundColor: getMealTypeColor(meal.meal_type) }]} />
                                <View style={styles.todayPlanRowInfo}>
                                    <Text style={styles.todayPlanMealType}>{meal.meal_type}</Text>
                                    <Text style={styles.todayPlanMealName} numberOfLines={1}>{meal.name}</Text>
                                </View>
                                {meal.image_uri && (
                                    <Image source={{ uri: meal.image_uri }} style={styles.todayPlanMealThumb} />
                                )}
                            </View>
                        ))
                    )}
                </View>

                {/* Eastern Cuisine */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Eastern Cuisine</Text>
                    {easternMeals.length > 10 && (
                        <Pressable onPress={() => navigation.navigate('CuisineList', { meals: easternMeals, title: 'Eastern Cuisine' })}>
                            <Text style={styles.seeAll}>See all</Text>
                        </Pressable>
                    )}
                </View>
                {loadingEastern ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                    <FlatList
                        data={easternMeals.slice(0, 10)}
                        keyExtractor={(item, idx) => `eastern-${item.idMeal}-${idx}`}
                        renderItem={renderSuggestion}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggList}
                    />
                )}

                {/* Western Cuisine */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Western Cuisine</Text>
                    {westernMeals.length > 10 && (
                        <Pressable onPress={() => navigation.navigate('CuisineList', { meals: westernMeals, title: 'Western Cuisine' })}>
                            <Text style={styles.seeAll}>See all</Text>
                        </Pressable>
                    )}
                </View>
                {loadingWestern ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                    <FlatList
                        data={westernMeals.slice(0, 10)}
                        keyExtractor={(item, idx) => `western-${item.idMeal}-${idx}`}
                        renderItem={renderSuggestion}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggList}
                    />
                )}
            </ScrollView>

            {/* Log Meal Modal */}
            <Modal visible={showLogModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Log a Meal</Text>
                        {logError ? <Text style={styles.modalError}>{logError}</Text> : null}
                        {[
                            { key: 'calories', label: 'Calories (kcal)' },
                            { key: 'protein', label: 'Protein (g)' },
                            { key: 'carbs', label: 'Carbs (g)' },
                            { key: 'fat', label: 'Fat (g)' },
                        ].map(field => (
                            <View key={field.key} style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{field.label}</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={logForm[field.key]}
                                    onChangeText={v => setLogForm(f => ({ ...f, [field.key]: v }))}
                                    placeholder="0"
                                    placeholderTextColor={colors.border}
                                />
                            </View>
                        ))}
                        <Pressable style={styles.logBtn} onPress={handleLogSubmit}>
                            <Text style={styles.logBtnText}>Save</Text>
                        </Pressable>
                        <Pressable style={styles.cancelBtn} onPress={() => setShowLogModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 100 },

    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    greeting: { fontSize: 26, fontWeight: '700', color: colors.text },
    subGreeting: { fontSize: 14, color: colors.subtitle, marginTop: 4 },

    // Daily Goals
    nutritionCard: {
        marginHorizontal: 20, marginTop: 16,
        backgroundColor: colors.white, borderRadius: 20, padding: 20,
        shadowColor: '#455A64', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    },
    nutritionCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    nutritionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    bmiChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    bmiText: { fontSize: 12, fontWeight: '600' },
    caloriesRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
    caloriesConsumed: { fontSize: 36, fontWeight: '700', color: colors.text },
    caloriesTarget: { fontSize: 14, color: colors.subtitle, marginLeft: 6 },
    caloriesTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
    caloriesFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
    macrosRow: { gap: 12, marginBottom: 16 },
    macroBarContainer: {},
    macroBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    macroLabel: { fontSize: 12, color: colors.subtitle, fontWeight: '500' },
    macroValue: { fontSize: 12, color: colors.text, fontWeight: '600' },
    macroTarget: { color: colors.subtitle, fontWeight: '400' },
    barTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },
    logBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    logBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },

    // Today's Plan
    todayPlanCard: {
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: '#F1F8F1',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.primaryLight,
    },
    todayPlanCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    todayPlanCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    todayPlanCardDate: { fontSize: 12, color: colors.subtitle, marginTop: 2 },
    todayPlanEditBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    todayPlanEditText: { color: colors.white, fontSize: 12, fontWeight: '700' },
    todayPlanEmpty: { paddingVertical: 12, alignItems: 'center' },
    todayPlanEmptyText: { fontSize: 13, color: colors.subtitle },
    todayPlanRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
    todayPlanRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.primaryLight },
    todayPlanDot: { width: 8, height: 8, borderRadius: 4 },
    todayPlanRowInfo: { flex: 1 },
    todayPlanMealType: { fontSize: 10, fontWeight: '700', color: colors.subtitle, textTransform: 'uppercase', marginBottom: 1 },
    todayPlanMealName: { fontSize: 14, fontWeight: '600', color: colors.text },
    todayPlanMealThumb: { width: 44, height: 44, borderRadius: 10 },

    // Sections
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, marginTop: 28, marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },

    // Suggestion cards
    suggList: { paddingHorizontal: 20, gap: 12 },
    suggCard: {
        width: CARD_WIDTH, backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden',
        shadowColor: '#455A64', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    suggImage: { width: CARD_WIDTH, height: 110 },
    suggInfo: { padding: 10 },
    suggName: { fontSize: 13, color: colors.text, fontWeight: '600', lineHeight: 18 },

    // Log modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 },
    modalError: { fontSize: 13, color: colors.error, marginBottom: 12 },
    inputGroup: { marginBottom: 12 },
    inputLabel: { fontSize: 13, color: colors.subtitle, fontWeight: '500', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
    cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    cancelBtnText: { fontSize: 15, color: colors.subtitle, fontWeight: '500' },
});
