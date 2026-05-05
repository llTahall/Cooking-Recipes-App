import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, ScrollView, FlatList, Pressable, TextInput,
    StyleSheet, SafeAreaView, Modal, KeyboardAvoidingView,
    Platform, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { colors } from '../constants/colors';
import { addMealToDay, removeMealFromDay, updateMealInDay } from '../store/slices/plannerSlice';
import { addMealToPlan, deleteMealFromPlan, updateMealInPlan, insertRecipe } from '../services/database';
import { addRecipe } from '../store/slices/recipesSlice';
import { searchRecipes, fetchByAreas, getRecipeById } from '../services/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const MEAL_TYPE_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'meal'];
const SUGG_AREAS = [
    'American', 'British', 'Canadian', 'Chinese', 'Croatian',
    'Dutch', 'Egyptian', 'Filipino', 'French', 'Greek',
    'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese',
    'Kenyan', 'Malaysian', 'Mexican', 'Moroccan', 'Polish',
    'Portuguese', 'Russian', 'Spanish', 'Thai', 'Tunisian',
    'Turkish', 'Vietnamese',
];
const EMPTY_FORM = { name: '', meal_type: 'Breakfast', ingredients: '', instructions: '', image_uri: null };

function parseIngredients(meal) {
    const result = [];
    for (let i = 1; i <= 20; i++) {
        const name = meal[`strIngredient${i}`]?.trim();
        const measure = meal[`strMeasure${i}`]?.trim();
        if (name) result.push({ name, measure: measure || '' });
    }
    return result;
}

export default function MealPlannerScreen() {
    const dispatch = useDispatch();
    const week = useSelector(s => s.planner.week);
    const localRecipes = useSelector(s => s.recipes.localRecipes);

    const todayKey = WEEK_DAYS[new Date().getDay()];
    const [selectedDay, setSelectedDay] = useState(todayKey);

    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('api');
    const [filterType, setFilterType] = useState('Breakfast');
    const [savedFilterType, setSavedFilterType] = useState('Breakfast');
    const [searchQuery, setSearchQuery] = useState('');
    const [allSuggestions, setAllSuggestions] = useState([]);
    const [loadingSugg, setLoadingSugg] = useState(false);
    const [searching, setSearching] = useState(false);
    const [apiResults, setApiResults] = useState([]);
    const [customForm, setCustomForm] = useState(EMPTY_FORM);
    const [saveToFav, setSaveToFav] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [apiDetails, setApiDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMealId, setEditingMealId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);

    const dayMeals = week[selectedDay] ?? [];
    const groupedMeals = MEAL_TYPE_ORDER.reduce((acc, type) => {
        const meals = dayMeals.filter(m => (m.meal_type ?? 'meal').toLowerCase() === type.toLowerCase());
        if (meals.length > 0) acc.push({ type, meals });
        return acc;
    }, []);

    useEffect(() => {
        if (!selectedMeal) { setApiDetails(null); return; }
        if (!selectedMeal.api_id) { setApiDetails(null); return; }
        if (selectedMeal.ingredients?.length > 0) { setApiDetails(null); return; }
        setLoadingDetails(true);
        getRecipeById(selectedMeal.api_id)
            .then(setApiDetails)
            .catch(() => setApiDetails(null))
            .finally(() => setLoadingDetails(false));
    }, [selectedMeal]);

    useEffect(() => {
        if (!showModal || activeTab !== 'api' || allSuggestions.length > 0) return;
        setLoadingSugg(true);
        fetchByAreas(SUGG_AREAS)
            .then(setAllSuggestions)
            .catch(() => { })
            .finally(() => setLoadingSugg(false));
    }, [showModal, activeTab]);

    const displayMeals = (() => {
        if (apiResults.length > 0) return apiResults;
        if (!searchQuery.trim()) return allSuggestions;
        return allSuggestions.filter(m => m.strMeal.toLowerCase().includes(searchQuery.toLowerCase()));
    })();

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        const local = allSuggestions.filter(m => m.strMeal.toLowerCase().includes(searchQuery.toLowerCase()));
        if (local.length > 0) { setApiResults([]); return; }
        setSearching(true);
        try {
            const results = await searchRecipes(searchQuery.trim());
            setApiResults(results ?? []);
        } catch { setApiResults([]); }
        finally { setSearching(false); }
    }, [searchQuery, allSuggestions]);

    const handleQueryChange = (text) => { setSearchQuery(text); setApiResults([]); };

    const handleAddApiMeal = useCallback(async (meal) => {
        setSaving(true);
        try {
            const newId = await addMealToPlan(selectedDay, {
                name: meal.strMeal, meal_type: filterType,
                image_uri: meal.strMealThumb, api_id: meal.idMeal,
            });
            dispatch(addMealToDay({ day: selectedDay, meal: { id: newId, name: meal.strMeal, meal_type: filterType, image_uri: meal.strMealThumb, api_id: meal.idMeal } }));
            closeModal();
        } catch (e) { Alert.alert('Error', 'Could not add meal: ' + e.message); }
        finally { setSaving(false); }
    }, [selectedDay, filterType]);

    const handleAddCustomMeal = useCallback(async () => {
        if (!customForm.name.trim()) { Alert.alert('Required', 'Enter a meal name.'); return; }
        setSaving(true);
        try {
            const ingredients = customForm.ingredients.trim()
                ? customForm.ingredients.split('\n').map(s => s.trim()).filter(Boolean)
                : [];
            const newId = await addMealToPlan(selectedDay, {
                name: customForm.name.trim(), meal_type: customForm.meal_type,
                image_uri: customForm.image_uri ?? null, ingredients,
                instructions: customForm.instructions.trim() || null,
            });
            dispatch(addMealToDay({
                day: selectedDay,
                meal: { id: newId, name: customForm.name.trim(), meal_type: customForm.meal_type, image_uri: customForm.image_uri ?? null, ingredients, instructions: customForm.instructions.trim() || null },
            }));
            if (saveToFav) {
                const alreadySaved = localRecipes.some(r => r.name === customForm.name.trim());
                if (alreadySaved) {
                    Alert.alert('Already saved', `"${customForm.name.trim()}" is already in your saved recipes.`);
                } else {
                    const favId = await insertRecipe({
                        name: customForm.name.trim(),
                        description: customForm.meal_type,
                        image_uri: customForm.image_uri ?? null,
                        ingredients,
                    });
                    dispatch(addRecipe({ id: favId, name: customForm.name.trim(), description: customForm.meal_type, image_uri: customForm.image_uri ?? null, ingredients }));
                }
            }

            closeModal();
        } catch (e) { Alert.alert('Error', 'Could not add meal: ' + e.message); }
        finally { setSaving(false); }
    }, [selectedDay, customForm, saveToFav]);

    const handleAddSavedRecipe = useCallback(async (recipe) => {
        setSaving(true);
        try {
            const ingredients = recipe.ingredients ?? [];
            const newId = await addMealToPlan(selectedDay, {
                name: recipe.name, meal_type: savedFilterType,
                image_uri: recipe.image_uri ?? null, ingredients, instructions: null,
            });
            dispatch(addMealToDay({
                day: selectedDay,
                meal: { id: newId, name: recipe.name, meal_type: savedFilterType, image_uri: recipe.image_uri ?? null, ingredients, instructions: null },
            }));
            closeModal();
        } catch (e) { Alert.alert('Error', 'Could not add meal: ' + e.message); }
        finally { setSaving(false); }
    }, [selectedDay, savedFilterType]);

    const handleUpdateMeal = useCallback(async () => {
        if (!editForm.name.trim()) { Alert.alert('Required', 'Enter a meal name.'); return; }
        setSaving(true);
        try {
            const ingredients = editForm.ingredients.trim()
                ? editForm.ingredients.split('\n').map(s => s.trim()).filter(Boolean)
                : [];
            await updateMealInPlan(editingMealId, { name: editForm.name.trim(), meal_type: editForm.meal_type, image_uri: editForm.image_uri ?? null, ingredients, instructions: editForm.instructions.trim() || null });
            dispatch(updateMealInDay({ day: selectedDay, meal: { id: editingMealId, name: editForm.name.trim(), meal_type: editForm.meal_type, image_uri: editForm.image_uri ?? null, ingredients, instructions: editForm.instructions.trim() || null } }));
            setShowEditModal(false);
            setEditForm(EMPTY_FORM);
            setEditingMealId(null);
        } catch (e) { Alert.alert('Error', 'Could not update meal: ' + e.message); }
        finally { setSaving(false); }
    }, [editForm, editingMealId, selectedDay]);

    const handleDelete = useCallback((meal) => {
        Alert.alert('Remove meal', `Remove "${meal.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: async () => { await deleteMealFromPlan(meal.id); dispatch(removeMealFromDay({ day: selectedDay, id: meal.id })); if (selectedMeal?.id === meal.id) setSelectedMeal(null); } },
        ]);
    }, [selectedDay, selectedMeal]);

    const openEdit = useCallback((meal) => {
        setEditingMealId(meal.id);
        setEditForm({
            name: meal.name, meal_type: meal.meal_type, image_uri: meal.image_uri ?? null,
            ingredients: meal.ingredients?.map(ing => typeof ing === 'object' ? `${ing.measure} ${ing.name}`.trim() : ing).join('\n') ?? '',
            instructions: meal.instructions ?? '',
        });
        setSelectedMeal(null);
        setShowEditModal(true);
    }, []);

    const closeModal = () => {
        setShowModal(false);
        setSearchQuery('');
        setApiResults([]);
        setCustomForm(EMPTY_FORM);
        setSaveToFav(false);
        setFilterType('Breakfast');
        setSavedFilterType('Breakfast');
    };

    const pickImageFor = async (setter) => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
        if (!result.canceled) setter(result.assets[0].uri);
    };
    const takePhotoFor = async (setter) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
        if (!result.canceled) setter(result.assets[0].uri);
    };

    const ingredients = selectedMeal?.ingredients?.length > 0 ? selectedMeal.ingredients : apiDetails ? parseIngredients(apiDetails) : [];
    const instructions = selectedMeal?.instructions || apiDetails?.strInstructions || null;

    const renderMealCard = (meal) => (
        <Pressable key={String(meal.id)} style={styles.mealCard} onPress={() => setSelectedMeal(meal)}>
            {meal.image_uri
                ? <Image source={{ uri: meal.image_uri }} style={styles.mealImage} />
                : <View style={[styles.mealImage, styles.mealImagePlaceholder]}><Text style={styles.mealPlaceholderText}>{meal.name[0]}</Text></View>
            }
            <View style={styles.mealInfo}>
                <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
                {meal.ingredients?.length > 0 && <Text style={styles.mealSubtext}>{meal.ingredients.length} ingredients</Text>}
            </View>
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(meal)}>
                <Text style={styles.deleteBtnText}>✕</Text>
            </Pressable>
        </Pressable>
    );

    const renderSuggestion = ({ item }) => (
        <Pressable style={styles.apiResultRow} onPress={() => handleAddApiMeal(item)} disabled={saving}>
            <Image source={{ uri: item.strMealThumb }} style={styles.apiResultImage} />
            <Text style={styles.apiResultName} numberOfLines={2}>{item.strMeal}</Text>
        </Pressable>
    );

    const PhotoPicker = ({ form, setForm }) => (
        <>
            <Text style={styles.inputLabel}>Photo <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.photoRow}>
                <Pressable style={styles.photoBtn} onPress={() => takePhotoFor(uri => setForm(f => ({ ...f, image_uri: uri })))}>
                    <Text style={styles.photoBtnText}>Take Photo</Text>
                </Pressable>
                <Pressable style={styles.photoBtn} onPress={() => pickImageFor(uri => setForm(f => ({ ...f, image_uri: uri })))}>
                    <Text style={styles.photoBtnText}>From Library</Text>
                </Pressable>
            </View>
            {form.image_uri && (
                <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: form.image_uri }} style={styles.photoPreview} />
                    <Pressable style={styles.photoRemove} onPress={() => setForm(f => ({ ...f, image_uri: null }))}>
                        <Text style={styles.photoRemoveText}>✕</Text>
                    </Pressable>
                </View>
            )}
        </>
    );

    const MealForm = ({ form, setForm, onSubmit, submitLabel, showFavToggle }) => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Meal name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Grilled chicken" placeholderTextColor={colors.border} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeRow}>
                {MEAL_TYPES.map(type => (
                    <Pressable key={type} onPress={() => setForm(f => ({ ...f, meal_type: type }))} style={[styles.typeChip, form.meal_type === type && styles.typeChipActive]}>
                        <Text style={[styles.typeChipText, form.meal_type === type && styles.typeChipTextActive]}>{type}</Text>
                    </Pressable>
                ))}
            </View>
            <PhotoPicker form={form} setForm={setForm} />
            <Text style={styles.inputLabel}>Ingredients <Text style={styles.optional}>(optional, one per line)</Text></Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder={"200g chicken\n1 cup rice"} placeholderTextColor={colors.border} value={form.ingredients} onChangeText={v => setForm(f => ({ ...f, ingredients: v }))} multiline numberOfLines={4} />
            <Text style={styles.inputLabel}>Instructions <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="How to prepare..." placeholderTextColor={colors.border} value={form.instructions} onChangeText={v => setForm(f => ({ ...f, instructions: v }))} multiline numberOfLines={4} />
            {showFavToggle && (
                <Pressable onPress={() => setSaveToFav(v => !v)} style={styles.favToggleRow}>
                    <View style={[styles.favCheckbox, saveToFav && styles.favCheckboxActive]}>
                        {saveToFav && <Text style={styles.favCheckmark}>✓</Text>}
                    </View>
                    <Text style={styles.favToggleLabel}>Save to My Recipes for later reuse</Text>
                </Pressable>
            )}
            <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={onSubmit} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : submitLabel}</Text>
            </Pressable>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <Text style={styles.screenTitle}>Meal Planner</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabsContainer} style={styles.dayTabsScroll}>
                {DAYS.map(day => {
                    const isToday = day === todayKey;
                    const isSelected = day === selectedDay;
                    return (
                        <Pressable key={day} onPress={() => setSelectedDay(day)} style={[styles.dayTab, isSelected && styles.dayTabActive]}>
                            <Text style={[styles.dayTabLabel, isSelected && styles.dayTabLabelActive]}>{DAY_LABELS[day]}</Text>
                            {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotActive]} />}
                        </Pressable>
                    );
                })}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.dayContent} showsVerticalScrollIndicator={false}>
                {groupedMeals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No meals planned</Text>
                        <Text style={styles.emptySubText}>Tap + to add a meal for {selectedDay}</Text>
                    </View>
                ) : (
                    groupedMeals.map(({ type, meals }) => (
                        <View key={type} style={styles.typeSection}>
                            <Text style={styles.typeSectionTitle}>{type}</Text>
                            {meals.map(meal => renderMealCard(meal))}
                        </View>
                    ))
                )}
            </ScrollView>

            <Pressable style={styles.fab} onPress={() => setShowModal(true)}>
                <Text style={styles.fabText}>+</Text>
            </Pressable>

            {/* Meal Detail Modal */}
            <Modal visible={!!selectedMeal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Pressable style={{ flex: 1 }} onPress={() => setSelectedMeal(null)} />
                    <View style={styles.detailSheet}>
                        {selectedMeal?.image_uri
                            ? <Image source={{ uri: selectedMeal.image_uri }} style={styles.detailImage} />
                            : <View style={[styles.detailImage, styles.detailImagePlaceholder]}><Text style={styles.detailPlaceholderText}>{selectedMeal?.name?.[0]}</Text></View>
                        }
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.detailHeader}>
                                <View style={styles.mealTypeBadge}><Text style={styles.mealTypeText}>{selectedMeal?.meal_type}</Text></View>
                                <View style={styles.detailActions}>
                                    {!selectedMeal?.api_id && <Pressable onPress={() => openEdit(selectedMeal)}><Text style={styles.detailEdit}>Edit</Text></Pressable>}
                                    <Pressable onPress={() => handleDelete(selectedMeal)}><Text style={styles.detailDelete}>Remove</Text></Pressable>
                                </View>
                            </View>
                            <Text style={styles.detailName}>{selectedMeal?.name}</Text>
                            {loadingDetails ? (
                                <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                            ) : (
                                <>
                                    {ingredients.length > 0 && (
                                        <>
                                            <Text style={styles.detailSectionTitle}>Ingredients</Text>
                                            {ingredients.map((ing, idx) => (
                                                <View key={idx} style={styles.ingredientRow}>
                                                    <View style={styles.dot} />
                                                    <Text style={styles.ingredientText}>{typeof ing === 'object' ? `${ing.measure} ${ing.name}`.trim() : ing}</Text>
                                                </View>
                                            ))}
                                        </>
                                    )}
                                    {instructions ? (
                                        <>
                                            <Text style={styles.detailSectionTitle}>Instructions</Text>
                                            <Text style={styles.detailInstructions}>{instructions}</Text>
                                        </>
                                    ) : null}
                                    {ingredients.length === 0 && !instructions && !loadingDetails && (
                                        <Text style={styles.noDetailsText}>No details available for this meal.</Text>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Add Meal Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Add Meal — {selectedDay}</Text>

                        <View style={styles.modalTabs}>
                            <Pressable style={[styles.modalTab, activeTab === 'api' && styles.modalTabActive]} onPress={() => setActiveTab('api')}>
                                <Text style={[styles.modalTabText, activeTab === 'api' && styles.modalTabTextActive]}>Search</Text>
                            </Pressable>
                            <Pressable style={[styles.modalTab, activeTab === 'saved' && styles.modalTabActive]} onPress={() => setActiveTab('saved')}>
                                <Text style={[styles.modalTabText, activeTab === 'saved' && styles.modalTabTextActive]}>My Recipes</Text>
                            </Pressable>
                            <Pressable style={[styles.modalTab, activeTab === 'custom' && styles.modalTabActive]} onPress={() => setActiveTab('custom')}>
                                <Text style={[styles.modalTabText, activeTab === 'custom' && styles.modalTabTextActive]}>Custom</Text>
                            </Pressable>
                        </View>

                        {activeTab === 'api' ? (
                            <View style={{ flex: 1 }}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer} style={styles.filterChipsScroll}>
                                    {MEAL_TYPES.map(type => (
                                        <Pressable key={type} onPress={() => setFilterType(type)} style={[styles.filterChip, filterType === type && styles.filterChipActive]}>
                                            <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>{type}</Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                                <View style={styles.searchRow}>
                                    <TextInput style={styles.searchInput} placeholder="Filter recipes..." placeholderTextColor={colors.border} value={searchQuery} onChangeText={handleQueryChange} onSubmitEditing={handleSearch} returnKeyType="search" />
                                    {searchQuery.length > 0 && (
                                        <Pressable style={styles.searchBtn} onPress={handleSearch}>
                                            <Text style={styles.searchBtnText}>Go</Text>
                                        </Pressable>
                                    )}
                                </View>
                                {loadingSugg || searching
                                    ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                                    : <FlatList data={displayMeals} keyExtractor={(item, idx) => `sugg-${item.idMeal}-${idx}`} renderItem={renderSuggestion} style={{ flex: 1 }} showsVerticalScrollIndicator={false} ListEmptyComponent={searchQuery ? <Text style={styles.noResults}>No results for "{searchQuery}"</Text> : null} />
                                }
                            </View>
                        ) : activeTab === 'saved' ? (
                            <View style={{ flex: 1 }}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer} style={styles.filterChipsScroll}>
                                    {MEAL_TYPES.map(type => (
                                        <Pressable key={type} onPress={() => setSavedFilterType(type)} style={[styles.filterChip, savedFilterType === type && styles.filterChipActive]}>
                                            <Text style={[styles.filterChipText, savedFilterType === type && styles.filterChipTextActive]}>{type}</Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {localRecipes.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Text style={styles.emptyText}>No saved recipes</Text>
                                            <Text style={styles.emptySubText}>Save recipes from Discover to use them here</Text>
                                        </View>
                                    ) : (
                                        localRecipes.map(recipe => (
                                            <Pressable key={String(recipe.id)} style={styles.apiResultRow} onPress={() => handleAddSavedRecipe(recipe)} disabled={saving}>
                                                {recipe.image_uri
                                                    ? <Image source={{ uri: recipe.image_uri }} style={styles.apiResultImage} />
                                                    : <View style={[styles.apiResultImage, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
                                                        <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: 18 }}>{recipe.name[0]}</Text>
                                                    </View>
                                                }
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.apiResultName} numberOfLines={1}>{recipe.name}</Text>
                                                    <Text style={styles.savedRecipeTypePill}>→ Add as {savedFilterType}</Text>
                                                </View>
                                            </Pressable>
                                        ))
                                    )}
                                </ScrollView>
                            </View>
                        ) : (
                            <MealForm form={customForm} setForm={setCustomForm} onSubmit={handleAddCustomMeal} submitLabel="Add Meal" showFavToggle />
                        )}

                        <Pressable style={styles.cancelBtn} onPress={closeModal}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit Meal Modal */}
            <Modal visible={showEditModal} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Edit Meal</Text>
                        <MealForm form={editForm} setForm={setEditForm} onSubmit={handleUpdateMeal} submitLabel="Save Changes" />
                        <Pressable style={styles.cancelBtn} onPress={() => { setShowEditModal(false); setEditForm(EMPTY_FORM); setEditingMealId(null); }}>
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
    screenTitle: { fontSize: 24, fontWeight: '700', color: colors.text, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },

    dayTabsScroll: { flexGrow: 0 },
    dayTabsContainer: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
    dayTab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    dayTabActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
    dayTabLabel: { fontSize: 13, fontWeight: '600', color: colors.subtitle },
    dayTabLabelActive: { color: colors.primaryDark },
    todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.subtitle, marginTop: 4 },
    todayDotActive: { backgroundColor: colors.primaryDark },

    dayContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
    typeSection: { marginBottom: 20 },
    typeSectionTitle: { fontSize: 12, fontWeight: '700', color: colors.subtitle, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

    mealCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, marginBottom: 10, padding: 12, gap: 12, shadowColor: '#455A64', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    mealImage: { width: 56, height: 56, borderRadius: 12 },
    mealImagePlaceholder: { backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    mealPlaceholderText: { fontSize: 20, fontWeight: '700', color: colors.primaryDark },
    mealInfo: { flex: 1 },
    mealName: { fontSize: 14, fontWeight: '600', color: colors.text },
    mealSubtext: { fontSize: 12, color: colors.subtitle, marginTop: 2 },
    mealTypeBadge: { backgroundColor: colors.secondaryLight, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginBottom: 4 },
    mealTypeText: { fontSize: 10, fontWeight: '700', color: colors.secondaryDark, textTransform: 'uppercase' },
    deleteBtn: { padding: 8 },
    deleteBtnText: { fontSize: 14, color: colors.subtitle },

    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
    emptySubText: { fontSize: 13, color: colors.subtitle },

    fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    fabText: { fontSize: 28, color: colors.white, lineHeight: 32 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    detailSheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '75%' },
    detailImage: { width: '100%', height: 200, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    detailImagePlaceholder: { backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    detailPlaceholderText: { fontSize: 48, fontWeight: '700', color: colors.primaryDark },
    detailBody: { padding: 20, paddingBottom: 40 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    detailActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    detailName: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 16 },
    detailEdit: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    detailDelete: { fontSize: 13, color: colors.error, fontWeight: '600' },
    detailSectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 4 },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    ingredientText: { flex: 1, fontSize: 14, color: colors.text },
    detailInstructions: { fontSize: 14, color: colors.text, lineHeight: 22 },
    noDetailsText: { fontSize: 14, color: colors.subtitle, textAlign: 'center', marginTop: 20 },

    modalSheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '85%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    modalTabs: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, marginBottom: 16 },
    modalTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    modalTabActive: { backgroundColor: colors.white, shadowColor: '#455A64', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    modalTabText: { fontSize: 13, fontWeight: '600', color: colors.subtitle },
    modalTabTextActive: { color: colors.text },

    filterChipsScroll: { flexGrow: 0, marginBottom: 12 },
    filterChipsContainer: { gap: 8, paddingHorizontal: 2 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
    filterChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
    filterChipText: { fontSize: 13, fontWeight: '600', color: colors.subtitle },
    filterChipTextActive: { color: colors.primaryDark },

    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    searchInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.text },
    searchBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
    searchBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
    noResults: { textAlign: 'center', color: colors.subtitle, marginTop: 24, fontSize: 14 },
    apiResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
    apiResultImage: { width: 52, height: 52, borderRadius: 10 },
    apiResultName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
    savedRecipeTypePill: { fontSize: 12, color: colors.primary, fontWeight: '500', marginTop: 3 },

    favToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 4, padding: 14, borderRadius: 14, backgroundColor: colors.primaryLight + '60', borderWidth: 1, borderColor: colors.primaryLight },
    favCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    favCheckboxActive: { backgroundColor: colors.primary },
    favCheckmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
    favToggleLabel: { flex: 1, fontSize: 13, color: colors.primaryDark, fontWeight: '500' },

    inputLabel: { fontSize: 13, color: colors.subtitle, fontWeight: '500', marginBottom: 6, marginTop: 12 },
    optional: { fontWeight: '400', color: colors.border },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text },
    textArea: { height: 90, textAlignVertical: 'top' },
    photoRow: { flexDirection: 'row', gap: 10 },
    photoBtn: { flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
    photoBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    photoPreviewContainer: { marginTop: 10, position: 'relative', alignSelf: 'flex-start' },
    photoPreview: { width: 100, height: 75, borderRadius: 10 },
    photoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.error, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    photoRemoveText: { color: colors.white, fontSize: 10, fontWeight: '700' },
    typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    typeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
    typeChipText: { fontSize: 13, fontWeight: '600', color: colors.subtitle },
    typeChipTextActive: { color: colors.primaryDark },
    saveBtn: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    cancelBtnText: { fontSize: 15, color: colors.subtitle },
});
