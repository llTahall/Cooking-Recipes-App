const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export async function fetchSuggestions() {
    const results = await Promise.all(
        Array.from({ length: 10 }, () =>
            fetch(`${BASE_URL}/random.php`).then(r => r.json()).then(d => d.meals?.[0])
        )
    );
    return results.filter(Boolean);
}
export async function fetchByAreas(areas) {
    const results = await Promise.all(
        areas.map(area =>
            fetch(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`)
                .then(r => r.json())
                .then(d => d.meals ?? [])
        )
    );
    const all = results.flat();
    const unique = all.filter((item, idx, self) =>
        idx === self.findIndex(t => t.idMeal === item.idMeal)
    );
    return unique.sort(() => Math.random() - 0.5);
}

export async function searchRecipes(query) {
    const res = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.meals ?? [];
}

export async function getRecipeById(id) {
    const res = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    const data = await res.json();
    return data.meals?.[0] ?? null;
}
export async function fetchCategories() {
    const res = await fetch(`${BASE_URL}/categories.php`);
    const data = await res.json();
    return data.categories ?? [];
}

export async function fetchByCategory(category) {
    const res = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
    const data = await res.json();
    return data.meals ?? [];
}
