import type { GenerateRequest, GenerateResponse, Preferences } from '$lib/types/index.js';

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		headers: { 'Content-Type': 'application/json' },
		...init
	});

	if (!res.ok) {
		let message = `Request failed: ${res.status}`;
		try {
			const body = await res.json();
			message = body.error ?? message;
		} catch {
			// ignore
		}
		throw new Error(message);
	}

	return res.json() as Promise<T>;
}

export const api = {
	generate: (input: GenerateRequest) =>
		request<GenerateResponse>('/meals/generate', { method: 'POST', body: JSON.stringify(input) }),

	getPlan: (id: string) => request<{ meal_plan: GenerateResponse; variants: unknown[] }>(`/meals/${id}`),

	recent: () =>
		request<{ id: string; week_start_date: string; moods: string[]; status: string }[]>('/meals/recent'),

	getPreferences: () => request<Preferences>('/preferences'),

	updatePreferences: (patch: Partial<Preferences>) =>
		request<{ success: boolean; preferences: Preferences }>('/preferences', {
			method: 'PUT',
			body: JSON.stringify(patch)
		})
};