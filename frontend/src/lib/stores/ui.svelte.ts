export const theme = {
	current: 'mealinbudget' as const,
	apply() {
		if (typeof window === 'undefined') return;
		const root = document.documentElement;
		root.dataset.theme = 'mealinbudget';
		root.style.colorScheme = 'light';
	}
};
