# NutriFlow 🍽️

A mobile app for recipe management and nutrition tracking, built with React Native + Expo.

## Features

- **Onboarding** — collects user profile (weight, height, age, goal) and calculates BMI + daily macros
- **Home** — local recipes + suggestions fetched from TheMealDB API
- **Discover** — search and browse recipes by category via external API
- **Meal Planner** — weekly planner (7 days), add meals from API, saved recipes, or create custom ones
- **Profile** — BMI gauge, daily macro targets, calorie tracking, saved recipes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Navigation | React Navigation (Bottom Tabs + Native Stack) |
| State Management | Redux Toolkit |
| Local Database | expo-sqlite |
| API | TheMealDB (free, no key required) |
| Camera / Gallery | expo-image-picker |

## Getting Started

```bash
git clone https://github.com/llTahall/Cooking-Recipes-App.git
cd Cooking-Recipes-App
npm install
npx expo start
