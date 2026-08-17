import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { GenerateRequest, GenerateResponse, Preferences } from '$lib/types/index.js';

interface MealinBudgetDB extends DBSchema {
	mealplans: {
		key: string;
		value: { id: string; plan: GenerateResponse; saved_at: string };
	};
	user_prefs: {
		key: string;
		value: { key: string; value: Preferences | GenerateRequest | string };
	};
	sync_status: {
		key: string;
		value: { key: string; value: string };
	};
	shopping_state: {
		key: string;
		value: { id: string; purchased: string[] };
	};
}

const DB_NAME = 'mealinbudget';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<MealinBudgetDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MealinBudgetDB>> {
	if (!dbPromise) {
		dbPromise = openDB<MealinBudgetDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('mealplans')) {
					db.createObjectStore('mealplans', { keyPath: 'id' });
				}
				if (!db.objectStoreNames.contains('user_prefs')) {
					db.createObjectStore('user_prefs', { keyPath: 'key' });
				}
				if (!db.objectStoreNames.contains('sync_status')) {
					db.createObjectStore('sync_status', { keyPath: 'key' });
				}
				if (!db.objectStoreNames.contains('shopping_state')) {
					db.createObjectStore('shopping_state', { keyPath: 'id' });
				}
			}
		});
	}
	return dbPromise;
}

export async function savePlan(plan: GenerateResponse): Promise<void> {
	const db = await getDB();
	const clone = structuredClone(plan);
	await db.put('mealplans', {
		id: clone.meal_plan_id,
		plan: clone,
		saved_at: new Date().toISOString()
	});
	await setSyncStatus('last_sync', new Date().toISOString());
}

export async function getPlan(id: string): Promise<GenerateResponse | undefined> {
	const db = await getDB();
	const entry = await db.get('mealplans', id);
	return entry?.plan;
}

export async function listPlans(): Promise<GenerateResponse[]> {
	const db = await getDB();
	const all = await db.getAll('mealplans');
	return all.sort((a, b) => b.saved_at.localeCompare(a.saved_at)).map((e) => e.plan);
}

export async function savePreferences(prefs: Preferences): Promise<void> {
	const db = await getDB();
	await db.put('user_prefs', { key: 'preferences', value: prefs });
}

export async function getPreferences(): Promise<Preferences | undefined> {
	const db = await getDB();
	const entry = await db.get('user_prefs', 'preferences');
	return entry?.value as Preferences | undefined;
}

export async function setLastGenerate(input: GenerateRequest): Promise<void> {
	const db = await getDB();
	await db.put('user_prefs', { key: 'last_generate', value: structuredClone(input) });
}

export async function getLastGenerate(): Promise<GenerateRequest | undefined> {
	const db = await getDB();
	const entry = await db.get('user_prefs', 'last_generate');
	return entry?.value as GenerateRequest | undefined;
}

export async function setLastPlanId(id: string): Promise<void> {
	const db = await getDB();
	await db.put('user_prefs', { key: 'last_plan_id', value: id });
}

export async function getLastPlanId(): Promise<string | undefined> {
	const db = await getDB();
	const entry = await db.get('user_prefs', 'last_plan_id');
	return entry?.value as string | undefined;
}

export async function setSyncStatus(key: string, value: string): Promise<void> {
	const db = await getDB();
	await db.put('sync_status', { key, value });
}

export async function getSyncStatus(key: string): Promise<string | undefined> {
	const db = await getDB();
	const entry = await db.get('sync_status', key);
	return entry?.value;
}

export async function getPurchased(planId: string): Promise<string[]> {
	const db = await getDB();
	const entry = await db.get('shopping_state', planId);
	return entry?.purchased ?? [];
}

export async function setPurchasedItem(planId: string, itemKey: string, isPurchased: boolean): Promise<void> {
	const db = await getDB();
	const entry = (await db.get('shopping_state', planId)) ?? { id: planId, purchased: [] };
	const set = new Set(entry.purchased);
	if (isPurchased) {
		set.add(itemKey);
	} else {
		set.delete(itemKey);
	}
	await db.put('shopping_state', { id: planId, purchased: [...set] });
}

export async function clearPurchased(planId: string): Promise<void> {
	const db = await getDB();
	await db.delete('shopping_state', planId);
}