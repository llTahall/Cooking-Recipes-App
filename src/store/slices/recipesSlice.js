import { createSlice } from '@reduxjs/toolkit';

const recipesSlice = createSlice({
    name: 'recipes',
    initialState: {
        localRecipes: [],
        suggestions: [],
        loading: false,
    },
    reducers: {
        setLocalRecipes: (state, action) => { state.localRecipes = action.payload; },
        setSuggestions: (state, action) => { state.suggestions = action.payload; },
        addLocalRecipe: (state, action) => { state.localRecipes.unshift(action.payload); },
        updateLocalRecipe: (state, action) => {
            const idx = state.localRecipes.findIndex(r => r.id === action.payload.id);
            if (idx !== -1) state.localRecipes[idx] = action.payload;
        },
        removeLocalRecipe: (state, action) => {
            state.localRecipes = state.localRecipes.filter(r => r.id !== action.payload);
        },
        setLoading: (state, action) => { state.loading = action.payload; },
    },
});

export const { setLocalRecipes, setSuggestions, addLocalRecipe, updateLocalRecipe, removeLocalRecipe, setLoading } = recipesSlice.actions;
export default recipesSlice.reducer;
