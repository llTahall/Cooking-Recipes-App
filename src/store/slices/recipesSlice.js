import { createSlice } from '@reduxjs/toolkit';

const recipesSlice = createSlice({
    name: 'recipes',
    initialState: { localRecipes: [], suggestions: [] },
    reducers: {
        setLocalRecipes: (state, action) => { state.localRecipes = action.payload; },
        setSuggestions: (state, action) => { state.suggestions = action.payload; },
        addRecipe: (state, action) => { state.localRecipes.unshift(action.payload); },
        removeRecipe: (state, action) => { state.localRecipes = state.localRecipes.filter(r => r.id !== action.payload); },
        updateRecipeInStore: (state, action) => {
            const idx = state.localRecipes.findIndex(r => r.id === action.payload.id);
            if (idx !== -1) state.localRecipes[idx] = action.payload;
        },
    },
});

export const { setLocalRecipes, setSuggestions, addRecipe, removeRecipe, updateRecipeInStore } = recipesSlice.actions;
export default recipesSlice.reducer;
