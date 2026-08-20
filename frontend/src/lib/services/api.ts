import type { GenerateRequest, GenerateResponse, PartialPlanData, Preferences } from '$lib/types/index.js';
import { PUBLIC_API_URL } from '$env/static/public';

const API_URL = PUBLIC_API_URL || 'http://localhost:3000/api';

export type GenerateJobStatus = 'queued' | 'generating' | 'completed' | 'failed';

export interface GenerateJobResult {
	job_id: string;
	status: GenerateJobStatus;
	stage?: string;
	pct?: number;
	step?: number;
	partial?: PartialPlanData;
	error?: string;
	plan?: GenerateResponse;
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 20000): Promise<T> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(`${API_URL}${path}`, {
			headers: { 'Content-Type': 'application/json' },
			...init,
			signal: controller.signal
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
	} catch (e) {
		if (e instanceof DOMException && e.name === 'AbortError') {
			throw new Error('Request timed out - please try again');
		}
		throw e;
	} finally {
		clearTimeout(timer);
	}
}

export const api = {
	generate: (input: GenerateRequest) =>
		request<GenerateJobResult>('/meals/generate', { method: 'POST', body: JSON.stringify(input) }),

	getGenerateStatus: (jobId: string) => request<GenerateJobResult>(`/meals/generate/${jobId}`),

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