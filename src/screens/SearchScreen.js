import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, FlatList, Pressable,
    StyleSheet, Image, ActivityIndicator, SafeAreaView,
    ScrollView,
} from 'react-native';
import { colors } from '../constants/colors';
import { searchRecipes, fetchCategories, fetchByCategory } from '../services/api';

const CARD_GAP = 12;

function MealCard({ meal, onPress }) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}>
            <Image source={{ uri: meal.strMealThumb }} style={styles.cardImage} />
            <View style={styles.cardOverlay} />
            <Text style={styles.cardName} numberOfLines={2}>{meal.strMeal}</Text>
        </Pressable>
    );
}

export default function SearchScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [catLoading, setCatLoading] = useState(true);
    const debounceRef = useRef(null);

    useEffect(() => {
        fetchCategories().then(cats => {
            setCategories(cats);
            setCatLoading(false);
            // Load first category by default
            if (cats.length > 0) {
                selectCategory(cats[0].strCategory);
            }
        }).catch(() => setCatLoading(false));
    }, []);

    function selectCategory(cat) {
        setSelectedCategory(cat);
        setQuery('');
        setLoading(true);
        fetchByCategory(cat)
            .then(results => { setMeals(results); setLoading(false); })
            .catch(() => setLoading(false));
    }

    function onQueryChange(text) {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!text.trim()) {
            // Revert to selected category
            if (selectedCategory) selectCategory(selectedCategory);
            else setMeals([]);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(() => {
            searchRecipes(text.trim())
                .then(results => { setMeals(results); setLoading(false); })
                .catch(() => setLoading(false));
        }, 400);
    }

    function goToDetail(meal) {
        navigation.navigate('ApiMealDetail', { id: meal.idMeal });
    }


    const renderMeal = useCallback(({ item }) => (
        <MealCard meal={item} onPress={() => goToDetail(item)} />
    ), []);

    const keyExtractor = useCallback((item, index) => `${item.idMeal}-${index}`, []);

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Discover</Text>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        value={query}
                        onChangeText={onQueryChange}
                        placeholder="Search any recipe..."
                        placeholderTextColor={colors.subtitle}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            {/* Category chips */}
            {!query.trim() && (
                <View style={styles.chipsWrapper}>
                    {catLoading
                        ? <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 20 }} />
                        : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.chipsScroll}
                            >
                                {categories.map(cat => {
                                    const active = selectedCategory === cat.strCategory;
                                    return (
                                        <Pressable
                                            key={cat.strCategory}
                                            onPress={() => selectCategory(cat.strCategory)}
                                            style={[styles.chip, active && styles.chipActive]}
                                        >
                                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                                {cat.strCategory}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}
                </View>
            )}

            {/* Results */}
            {loading
                ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )
                : meals.length === 0
                    ? (
                        <View style={styles.center}>
                            <Text style={styles.emptyIcon}>🍽️</Text>
                            <Text style={styles.emptyText}>No recipes found</Text>
                            <Text style={styles.emptySubtext}>Try a different search or category</Text>
                        </View>
                    )
                    : (
                        <FlatList
                            data={meals}
                            renderItem={renderMeal}
                            keyExtractor={keyExtractor}
                            numColumns={2}
                            columnWrapperStyle={styles.row}
                            contentContainerStyle={styles.grid}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F7F5' },

    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#F5F7F5' },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 12 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 16,
        paddingHorizontal: 14, paddingVertical: 10,
        shadowColor: '#455A64', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },

    chipsWrapper: { height: 48, justifyContent: 'center', marginBottom: 4 },
    chipsScroll: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
    chip: {
        paddingHorizontal: 16, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
        borderColor: colors.border, backgroundColor: '#fff',
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, fontWeight: '500', color: colors.subtitle },
    chipTextActive: { color: '#fff', fontWeight: '700' },

    grid: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
    row: { gap: CARD_GAP, marginBottom: CARD_GAP },

    card: {
        flex: 1, borderRadius: 18, overflow: 'hidden',
        height: 160,
        backgroundColor: colors.border,
    },
    cardImage: { width: '100%', height: '100%', position: 'absolute' },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.32)',
        borderRadius: 18,
    },
    cardName: {
        position: 'absolute', bottom: 10, left: 10, right: 10,
        fontSize: 13, fontWeight: '700', color: '#fff',
        lineHeight: 18,
    },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 17, fontWeight: '700', color: colors.text },
    emptySubtext: { fontSize: 14, color: colors.subtitle, marginTop: 4 },
});
