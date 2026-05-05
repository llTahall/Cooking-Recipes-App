import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, Image, Pressable,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { colors } from '../constants/colors';
import { getRecipeById } from '../services/api';
import { insertRecipe } from '../services/database';
import { useDispatch, useSelector } from 'react-redux';
import { addRecipe } from '../store/slices/recipesSlice';


function parseIngredients(meal) {
    const result = [];
    for (let i = 1; i <= 20; i++) {
        const name = meal[`strIngredient${i}`]?.trim();
        const measure = meal[`strMeasure${i}`]?.trim();
        if (name) result.push({ name, measure: measure || '' });
    }
    return result;
}

export default function ApiMealDetailScreen({ route }) {
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (meal) setSaved(localRecipes.some(r => r.name === meal.strMeal));
    }, [meal]);


    const localRecipes = useSelector(s => s.recipes.localRecipes);
    const { id } = route.params;
    const dispatch = useDispatch();
    const [meal, setMeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getRecipeById(id)
            .then(setMeal)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const handleSave = async () => {
        if (!meal) return;
        const alreadySaved = localRecipes.some(r => r.name === meal.strMeal);
        if (alreadySaved) {
            Alert.alert('Already saved', 'This recipe is already in your collection.');
            return;
        }
        setSaving(true);
        try {
            const ingredients = parseIngredients(meal);
            const newId = await insertRecipe({
                name: meal.strMeal,
                description: meal.strCategory + ' · ' + meal.strArea,
                image_uri: meal.strMealThumb,
                ingredients,
            });
            dispatch(addRecipe({ id: newId, name: meal.strMeal, description: meal.strCategory + ' · ' + meal.strArea, image_uri: meal.strMealThumb, ingredients }));
            setSaved(true);
            Alert.alert('Saved', 'Recipe added to My Recipes.');
        } catch {
            Alert.alert('Error', 'Could not save recipe.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!meal) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Could not load recipe.</Text>
            </View>
        );
    }

    const ingredients = parseIngredients(meal);
    const steps = meal.strInstructions
        ?.split(/\r\n|\n/)
        .map(s => s.trim())
        .filter(Boolean) ?? [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: meal.strMealThumb }} style={styles.heroImage} />

            <View style={styles.body}>
                <Text style={styles.title}>{meal.strMeal}</Text>

                <View style={styles.pills}>
                    {meal.strCategory ? (
                        <View style={[styles.pill, { backgroundColor: colors.primaryLight }]}>
                            <Text style={[styles.pillText, { color: colors.primaryDark }]}>{meal.strCategory}</Text>
                        </View>
                    ) : null}
                    {meal.strArea ? (
                        <View style={[styles.pill, { backgroundColor: colors.secondaryLight }]}>
                            <Text style={[styles.pillText, { color: colors.secondaryDark }]}>{meal.strArea}</Text>
                        </View>
                    ) : null}
                </View>

                <Text style={styles.sectionTitle}>Ingredients</Text>
                <View style={styles.ingredientsList}>
                    {ingredients.map((item, idx) => (
                        <View key={idx} style={styles.ingredientRow}>
                            <View style={styles.dot} />
                            <Text style={styles.ingredientName}>{item.name}</Text>
                            {item.measure ? (
                                <Text style={styles.ingredientMeasure}>{item.measure}</Text>
                            ) : null}
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Instructions</Text>
                {steps.map((step, idx) => (
                    <View key={idx} style={styles.stepRow}>
                        <Text style={styles.stepNumber}>{idx + 1}</Text>
                        <Text style={styles.stepText}>{step}</Text>
                    </View>
                ))}

                <Pressable
                    style={[styles.saveBtn, (saving || saved) && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving || saved}
                >
                    <Text style={styles.saveBtnText}>
                        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save to My Recipes'}
                    </Text>
                </Pressable>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    errorText: { fontSize: 15, color: colors.subtitle },

    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 100 },

    heroImage: { width: '100%', height: 280 },

    body: { padding: 20 },

    title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12, lineHeight: 30 },

    pills: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    pillText: { fontSize: 12, fontWeight: '600' },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },

    ingredientsList: { marginBottom: 28 },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 12 },
    ingredientName: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
    ingredientMeasure: { fontSize: 13, color: colors.subtitle },

    stepRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
    stepNumber: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.primaryLight,
        color: colors.primaryDark,
        fontWeight: '700', fontSize: 13,
        textAlign: 'center', lineHeight: 28,
    },
    stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 22 },

    saveBtn: {
        marginTop: 28,
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
    },
    saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
