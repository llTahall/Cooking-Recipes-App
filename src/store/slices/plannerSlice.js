import { createSlice } from '@reduxjs/toolkit';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const initialWeek = Object.fromEntries(DAYS.map(d => [d, []]));

const plannerSlice = createSlice({
    name: 'planner',
    initialState: { week: initialWeek },
    reducers: {
        setWeek: (state, action) => {
            state.week = action.payload;
        },
        addMealToDay: (state, action) => {
            const { day, meal } = action.payload;
            state.week[day].push(meal);
        },
        removeMealFromDay: (state, action) => {
            const { day, id } = action.payload;
            state.week[day] = state.week[day].filter(m => m.id !== id);
        },
        updateMealInDay: (state, action) => {
            const { day, meal } = action.payload;
            const idx = state.week[day].findIndex(m => m.id === meal.id);
            if (idx !== -1) state.week[day][idx] = meal;
        },

    },
});

export const { setWeek, addMealToDay, removeMealFromDay, updateMealInDay } = plannerSlice.actions;
export default plannerSlice.reducer;
