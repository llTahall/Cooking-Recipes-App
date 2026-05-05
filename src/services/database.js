import * as SQLite from 'expo-sqlite';

let db;

export async function initDatabase() {
    db = await SQLite.openDatabaseAsync('nutriflow.db');

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            image_uri TEXT,
            ingredients TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
    `);

    const { user_version } = await db.getFirstAsync('PRAGMA user_version');

    if (user_version < 1) {
        await db.execAsync('DROP TABLE IF EXISTS meal_plan');
        await db.execAsync('PRAGMA user_version = 1');
    }

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS meal_plan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day TEXT NOT NULL,
            name TEXT NOT NULL,
            meal_type TEXT DEFAULT 'meal',
            image_uri TEXT,
            ingredients TEXT,
            instructions TEXT,
            api_id TEXT
        );
    `);

    if (user_version >= 1 && user_version < 2) {
        try { await db.execAsync('ALTER TABLE meal_plan ADD COLUMN api_id TEXT'); } catch { }
        await db.execAsync('PRAGMA user_version = 2');
    }
}

export async function insertRecipe(recipe) {
    const { name, description, image_uri, ingredients } = recipe;
    const result = await db.runAsync(
        'INSERT INTO recipes (name, description, image_uri, ingredients) VALUES (?, ?, ?, ?)',
        [name, description ?? '', image_uri ?? '', JSON.stringify(ingredients ?? [])]
    );
    return result.lastInsertRowId;
}

export async function getAllRecipes() {
    const rows = await db.getAllAsync('SELECT * FROM recipes ORDER BY created_at DESC');
    return rows.map(r => ({ ...r, ingredients: JSON.parse(r.ingredients ?? '[]') }));
}

export async function updateRecipe(id, recipe) {
    const { name, description, image_uri, ingredients } = recipe;
    await db.runAsync(
        'UPDATE recipes SET name=?, description=?, image_uri=?, ingredients=? WHERE id=?',
        [name, description ?? '', image_uri ?? '', JSON.stringify(ingredients ?? []), id]
    );
}

export async function deleteRecipe(id) {
    await db.runAsync('DELETE FROM recipes WHERE id=?', [id]);
}

export async function getMealPlan() {
    const rows = await db.getAllAsync('SELECT * FROM meal_plan ORDER BY id ASC');
    return rows.map(r => ({
        ...r,
        ingredients: r.ingredients ? JSON.parse(r.ingredients) : [],
    }));
}

export async function addMealToPlan(day, meal) {
    const result = await db.runAsync(
        'INSERT INTO meal_plan (day, name, meal_type, image_uri, ingredients, instructions, api_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            day,
            meal.name,
            meal.meal_type ?? 'meal',
            meal.image_uri ?? null,
            meal.ingredients ? JSON.stringify(meal.ingredients) : null,
            meal.instructions ?? null,
            meal.api_id ?? null,
        ]
    );
    return result.lastInsertRowId;
}

export async function deleteMealFromPlan(id) {
    await db.runAsync('DELETE FROM meal_plan WHERE id=?', [id]);
}
export async function updateMealInPlan(id, meal) {
    await db.runAsync(
        'UPDATE meal_plan SET name=?, meal_type=?, image_uri=?, ingredients=?, instructions=? WHERE id=?',
        [
            meal.name,
            meal.meal_type ?? 'meal',
            meal.image_uri ?? null,
            meal.ingredients ? JSON.stringify(meal.ingredients) : null,
            meal.instructions ?? null,
            id,
        ]
    );
}

