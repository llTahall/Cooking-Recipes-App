import { createSlice } from '@reduxjs/toolkit';

const dailyLogSlice = createSlice({
    name: 'dailyLog',
    initialState: { calories: 0, protein: 0, carbs: 0, fat: 0, date: null },
    reducers: {
        loadLog: (state, action) => ({ ...state, ...action.payload }),
        addMealLog: (state, action) => {
            state.calories += action.payload.calories ?? 0;
            state.protein += action.payload.protein ?? 0;
            state.carbs += action.payload.carbs ?? 0;
            state.fat += action.payload.fat ?? 0;
        },
        resetLog: () => ({ calories: 0, protein: 0, carbs: 0, fat: 0, date: null }),
    },
});

export const { loadLog, addMealLog, resetLog } = dailyLogSlice.actions;
export default dailyLogSlice.reducer;
