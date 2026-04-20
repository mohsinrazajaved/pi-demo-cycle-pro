/**
 * mockDataService.js
 * Offline-first localStorage CRUD.
 * Stores Profiles and Workouts locally, no network required.
 */

const KEYS = {
    profiles: 'mock_profiles',
    workouts: 'mock_workouts',
    seeded: 'mock_seeded',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function uid() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
}

function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function sortItems(items, sortStr) {
    if (!sortStr) return items;
    const desc = sortStr.startsWith('-');
    const field = desc ? sortStr.slice(1) : sortStr;
    return [...items].sort((a, b) => {
        const av = a[field] ?? '';
        const bv = b[field] ?? '';
        if (av < bv) return desc ? 1 : -1;
        if (av > bv) return desc ? -1 : 1;
        return 0;
    });
}

// ─── Seed initial mock data on first run ────────────────────────────────────

function seedMockData() {
    if (localStorage.getItem(KEYS.seeded)) return;

    // Default profile
    const profiles = [
        {
            id: uid(), name: 'Demo Rider', age: 35, weight: 75, weight_unit: 'KG',
            height: 178, height_unit: 'Metric', gender: 'Male',
            activity_level: 'Moderately Active', created_date: new Date(Date.now() - 30 * 864e5).toISOString()
        },
    ];
    save(KEYS.profiles, profiles);

    // Seed 20 mock workouts spread over last 30 days
    const workouts = [];
    for (let i = 19; i >= 0; i--) {
        const daysAgo = Math.floor(i * 1.5);
        const date = new Date(Date.now() - daysAgo * 864e5).toISOString();
        const duration = 20 * 60 + Math.floor(Math.random() * 20 * 60);
        const avgCadence = 65 + Math.floor(Math.random() * 30);
        const avgPower = 90 + Math.floor(Math.random() * 80);
        workouts.push({
            id: uid(),
            workout_date: date,
            duration_seconds: duration,
            calories: Math.round((duration / 60) * 7.5 + Math.random() * 20),
            distance_km: Math.round((duration / 3600) * 22 * 10) / 10,
            avg_speed_kmh: 18 + Math.round(Math.random() * 8 * 10) / 10,
            max_speed_kmh: 22 + Math.round(Math.random() * 10 * 10) / 10,
            avg_cadence: avgCadence,
            max_cadence: avgCadence + 20 + Math.floor(Math.random() * 15),
            avg_heart_rate: 130 + Math.floor(Math.random() * 30),
            max_heart_rate: 165 + Math.floor(Math.random() * 15),
            avg_power: avgPower,
            max_power: avgPower + 40 + Math.floor(Math.random() * 30),
        });
    }
    save(KEYS.workouts, workouts);
    localStorage.setItem(KEYS.seeded, '1');
}

seedMockData();

// ─── Generic entity factory ──────────────────────────────────────────────────

function makeEntity(key, dateField = 'created_date') {
    return {
        list(sortStr, limit) {
            let items = load(key);
            items = sortItems(items, sortStr || `-${dateField}`);
            if (limit) items = items.slice(0, limit);
            return Promise.resolve(items);
        },
        filter(query) {
            const items = load(key);
            const results = items.filter(item =>
                Object.entries(query).every(([k, v]) => item[k] === v)
            );
            return Promise.resolve(results);
        },
        create(data) {
            const items = load(key);
            const newItem = { id: uid(), [dateField]: new Date().toISOString(), ...data };
            items.push(newItem);
            save(key, items);
            return Promise.resolve(newItem);
        },
        update(id, data) {
            const items = load(key);
            const idx = items.findIndex(i => i.id === id);
            if (idx !== -1) {
                items[idx] = { ...items[idx], ...data };
                save(key, items);
                return Promise.resolve(items[idx]);
            }
            return Promise.resolve(null);
        },
        delete(id) {
            const items = load(key).filter(i => i.id !== id);
            save(key, items);
            return Promise.resolve({ id });
        },
    };
}

// ─── Exported mock service ───────────────────────────────────────────────────

export const mockDB = {
    entities: {
        Profile: makeEntity(KEYS.profiles, 'created_date'),
        Workout: makeEntity(KEYS.workouts, 'workout_date'),
    },
};
