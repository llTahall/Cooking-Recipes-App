import { configureStore } from '@reduxjs/toolkit';
import recipesReducer from './slices/recipesSlice';
import plannerReducer from './slices/plannerSlice';
import profileReducer from './slices/profileSlice';
import dailyLogReducer from './slices/dailyLogSlice';

export const store = configureStore({
  reducer: {
    recipes: recipesReducer,
    planner: plannerReducer,
    profile: profileReducer,
    dailyLog: dailyLogReducer,
  },
});
