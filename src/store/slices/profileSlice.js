import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
    name: 'profile',
    initialState: {
        firstName: '',
        lastName: '',
        sex: 'male',
        weight: '',
        height: '',
        age: '',
        goal: 'maintain',
        activity: 'moderate',
        results: null,
    },
    reducers: {
        updateProfile: (state, action) => {
            return { ...state, ...action.payload };
        },
        setResults: (state, action) => {
            state.results = action.payload;
        },
    },
});

export const { updateProfile, setResults } = profileSlice.actions;
export default profileSlice.reducer;
