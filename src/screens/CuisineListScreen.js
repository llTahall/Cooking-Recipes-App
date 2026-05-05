import React, { useState } from 'react';
import {
    View, Text, FlatList, Pressable, Image,
    StyleSheet, SafeAreaView,
} from 'react-native';
import { colors } from '../constants/colors';

const PAGE_SIZE = 10;
const CARD_MARGIN = 8;

export default function CuisineListScreen({ route, navigation }) {
    const { meals, title } = route.params;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const visibleMeals = meals.slice(0, visibleCount);
    const hasMore = visibleCount < meals.length;

    const renderItem = ({ item, index }) => (
        <Pressable
            style={[styles.card, index % 2 === 0 ? { marginRight: CARD_MARGIN } : { marginLeft: CARD_MARGIN }]}
            onPress={() => navigation.navigate('ApiMealDetail', { id: item.idMeal })}
        >
            <Image source={{ uri: item.strMealThumb }} style={styles.cardImage} />
            <Text style={styles.cardName} numberOfLines={2}>{item.strMeal}</Text>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <Text style={styles.title}>{title}</Text>
            <FlatList
                data={visibleMeals}
                keyExtractor={(item, idx) => `cuisine-${item.idMeal}-${idx}`}
                renderItem={renderItem}
                numColumns={2}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    hasMore ? (
                        <Pressable
                            style={styles.loadMoreBtn}
                            onPress={() => setVisibleCount(c => c + PAGE_SIZE)}
                        >
                            <Text style={styles.loadMoreText}>Load more</Text>
                        </Pressable>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

const CARD_WIDTH = '50%';

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    title: {
        fontSize: 22, fontWeight: '700', color: colors.text,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    },

    list: { paddingHorizontal: 12, paddingBottom: 100 },

    card: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#455A64',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardImage: { width: '100%', height: 120 },
    cardName: {
        fontSize: 13, fontWeight: '600', color: colors.text,
        padding: 10, lineHeight: 18,
    },

    loadMoreBtn: {
        marginHorizontal: 40, marginTop: 8, marginBottom: 20,
        backgroundColor: colors.primaryLight,
        borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    },
    loadMoreText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
});
