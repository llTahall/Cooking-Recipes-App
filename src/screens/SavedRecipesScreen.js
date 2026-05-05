import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, StyleSheet,
    Image, Modal, Alert, SafeAreaView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors } from '../constants/colors';
import { removeRecipe } from '../store/slices/recipesSlice';
import { deleteRecipe } from '../services/database';

export default function SavedRecipesScreen({ navigation }) {
    const dispatch = useDispatch();
    const localRecipes = useSelector(s => s.recipes.localRecipes);
    const [selected, setSelected] = useState(null);

    async function handleDelete(recipe) {
        Alert.alert('Remove recipe', `Remove "${recipe.name}" from your collection?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    if (selected?.id === recipe.id) setSelected(null);
                    await deleteRecipe(recipe.id);
                    dispatch(removeRecipe(recipe.id));
                }
            },
        ]);
    }

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>‹ Back</Text>
                </Pressable>
                <Text style={styles.title}>Saved Recipes</Text>
                <View style={{ width: 60 }} />
            </View>

            {localRecipes.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🍽️</Text>
                    <Text style={styles.emptyText}>No saved recipes yet</Text>
                    <Text style={styles.emptySubtext}>Save recipes from Discover to find them here</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {localRecipes.map(recipe => (
                        <Pressable
                            key={String(recipe.id)}
                            onPress={() => setSelected(recipe)}
                            style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
                        >
                            {recipe.image_uri
                                ? <Image source={{ uri: recipe.image_uri }} style={styles.cardImg} />
                                : (
                                    <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                                        <Text style={styles.cardImgInitial}>{recipe.name[0]}</Text>
                                    </View>
                                )}
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardName} numberOfLines={1}>{recipe.name}</Text>
                                {recipe.description
                                    ? <Text style={styles.cardDesc} numberOfLines={1}>{recipe.description}</Text>
                                    : null}
                                {recipe.ingredients?.length > 0
                                    ? <Text style={styles.cardMeta}>{recipe.ingredients.length} ingredients</Text>
                                    : null}
                            </View>
                            <Pressable onPress={() => handleDelete(recipe)} style={styles.deleteBtn} hitSlop={10}>
                                <Text style={styles.deleteBtnText}>✕</Text>
                            </Pressable>
                        </Pressable>
                    ))}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {/* Detail Modal */}
            <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
                <SafeAreaView style={styles.modalSafe}>
                    <View style={styles.modalHeader}>
                        <View style={{ width: 60 }} />
                        <Text style={styles.modalTitle} numberOfLines={1}>{selected?.name}</Text>
                        <Pressable onPress={() => setSelected(null)} style={{ width: 60, alignItems: 'flex-end' }}>
                            <Text style={styles.modalClose}>Close</Text>
                        </Pressable>
                    </View>
                    <ScrollView style={styles.modalBody}>
                        {selected?.image_uri && (
                            <Image source={{ uri: selected.image_uri }} style={styles.detailImg} />
                        )}
                        {selected?.description
                            ? <Text style={styles.detailDesc}>{selected.description}</Text>
                            : null}
                        {selected?.ingredients?.length > 0 && (
                            <>
                                <Text style={styles.detailSection}>Ingredients</Text>
                                {selected.ingredients.map((ing, idx) => (
                                    <View key={idx} style={styles.ingRow}>
                                        <View style={styles.ingDot} />
                                        <Text style={styles.ingText}>
                                            {typeof ing === 'object' ? `${ing.measure} ${ing.name}`.trim() : ing}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        )}
                        {!selected?.ingredients?.length && !selected?.description && (
                            <Text style={styles.detailEmpty}>No details saved for this recipe.</Text>
                        )}
                        <Pressable onPress={() => { setSelected(null); handleDelete(selected); }} style={styles.removeBtn}>
                            <Text style={styles.removeBtnText}>Remove from collection</Text>
                        </Pressable>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F7F5' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F5F7F5' },
    backBtn: { width: 60 },
    backText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '700', color: colors.text },
    emptySubtext: { fontSize: 14, color: colors.subtitle, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

    list: { paddingHorizontal: 20, paddingTop: 8 },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 18, marginBottom: 12, padding: 14, gap: 12,
        shadowColor: '#455A64', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    },
    cardImg: { width: 60, height: 60, borderRadius: 14 },
    cardImgPlaceholder: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    cardImgInitial: { fontSize: 22, fontWeight: '700', color: colors.primaryDark },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: '700', color: colors.text },
    cardDesc: { fontSize: 12, color: colors.subtitle, marginTop: 3 },
    cardMeta: { fontSize: 12, color: colors.primary, fontWeight: '500', marginTop: 4 },
    deleteBtn: { padding: 6 },
    deleteBtnText: { fontSize: 16, color: colors.subtitle },

    modalSafe: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
    modalClose: { fontSize: 15, color: colors.subtitle },
    modalBody: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    detailImg: { width: '100%', height: 220, borderRadius: 18, marginBottom: 16 },
    detailDesc: { fontSize: 14, color: colors.subtitle, marginBottom: 20, lineHeight: 20 },
    detailSection: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
    ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
    ingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 12 },
    ingText: { flex: 1, fontSize: 14, color: colors.text },
    detailEmpty: { fontSize: 14, color: colors.subtitle, textAlign: 'center', marginTop: 40 },
    removeBtn: { marginTop: 28, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.error + '40', backgroundColor: colors.error + '08', alignItems: 'center' },
    removeBtnText: { fontSize: 14, fontWeight: '600', color: colors.error },
});
