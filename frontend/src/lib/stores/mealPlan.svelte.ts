import type { GenerateRequest, GenerateResponse } from '$lib/types/index.js';
import {
	savePlan,
	getPlan as getStoredPlan,
	listPlans as listStoredPlans,
	setLastPlanId,
	getLastPlanId,
	setLastGenerate,
	getLastGenerate
} from '$lib/db/local.js';

function createMealPlanStore() {
	let current = $state<GenerateResponse | null>(null);
	let savedPlans = $state<GenerateResponse[]>([]);
	let lastInputs = $state<GenerateRequest | null>(null);
	let initialized = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);

	function normalizeInputs(inputs: GenerateRequest | null): GenerateRequest | null {
		if (!inputs) return null;
		const any = inputs as GenerateRequest & { mood?: string };
		if (!any.moods && any.mood) {
			return { ...inputs, moods: [any.mood as GenerateRequest['moods'][number]] };
		}
		return inputs;
	}

	async function init(): Promise<void> {
		if (initialized) return;
		initialized = true;
		loading = true;
		error = null;
		try {
			lastInputs = normalizeInputs((await getLastGenerate()) ?? null);
			savedPlans = await listStoredPlans();
			const lastId = await getLastPlanId();
			if (lastId) {
				const stored = await getStoredPlan(lastId);
				if (stored) {
					current = stored;
					return;
				}
			}
			current = savedPlans[0] ?? null;
		} finally {
			loading = false;
		}
	}

	async function setPlan(plan: GenerateResponse, inputs?: GenerateRequest): Promise<void> {
		await savePlan(plan);
		current = plan;
		await setLastPlanId(plan.meal_plan_id);
		if (inputs) {
			await setLastGenerate(inputs);
			lastInputs = inputs;
		}
		await refreshSaved();
	}

	async function loadPlan(id: string): Promise<void> {
		loading = true;
		error = null;
		try {
			const stored = await getStoredPlan(id);
			current = stored ?? null;
			if (!stored) error = 'Meal plan not found on this device.';
			else await setLastPlanId(id);
		} finally {
			loading = false;
		}
	}

	async function refreshSaved(): Promise<void> {
		savedPlans = await listStoredPlans();
	}

	return {
		get current() {
			return current;
		},
		get savedPlans() {
			return savedPlans;
		},
		get lastInputs() {
			return lastInputs;
		},
		get initialized() {
			return initialized;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		init,
		setPlan,
		loadPlan,
		refreshSaved
	};
}

export const mealPlan = createMealPlanStore();