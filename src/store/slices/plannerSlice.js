import { createSlice } from '@reduxjs/toolkit';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const plannerSlice = createSlice({
    name: 'planner',
    initialState: {
        week: DAYS.reduce((acc, day) => ({ ...acc, [day]: null }), {}),
        notificationsEnabled: false,
    },
    reducers: {
        setMealForDay: (state, action) => {
            const { day, recipe } = action.payload;
            state.week[day] = recipe;
        },
        removeMealFromDay: (state, action) => {
            state.week[action.payload] = null;
        },
        setWeek: (state, action) => { state.week = action.payload; },
        setNotificationsEnabled: (state, action) => {
            state.notificationsEnabled = action.payload;
        },
    },
});

export const { setMealForDay, removeMealFromDay, setWeek, setNotificationsEnabled } = plannerSlice.actions;
export default plannerSlice.reducer;
