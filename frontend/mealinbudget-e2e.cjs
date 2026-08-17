const { chromium } = require('playwright');

const APP = 'http://localhost:5173';

async function main() {
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	const results = [];
	const check = (name, ok) => {
		results.push(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
	};

	// 1. Generate a plan from the form
	await page.goto(`${APP}/generate`, { waitUntil: 'networkidle' });
	await page.click('button:has-text("Protein Packed")');
	await page.click('button:has-text("Generate Meal Plan")');
	try {
		await page.waitForURL('**/meal-plan', { timeout: 10000 });
	} catch (e) {
		const body = await page.locator('body').innerText();
		console.log('--- generate page body after click ---');
		console.log(body);
		throw e;
	}
	check('generate -> meal-plan', page.url().includes('/meal-plan'));

	// 2. Meal plan shows meals
	const mealCards = await page.locator('h3').count();
	check('meal plan shows meal cards', mealCards >= 3);

	// 2b. Meal-type filter changes card count
	const breakfastBefore = await page.locator('h3').count();
	await page.click('button:has-text("Breakfast")');
	await page.waitForTimeout(300);
	const breakfastAfter = await page.locator('h3').count();
	check('meal-type filter filters cards', breakfastAfter <= breakfastBefore && breakfastAfter >= 1);
	const hasDailyTotal = /Daily Total/.test(await page.locator('body').innerText());
	check('meal-plan shows daily total', hasDailyTotal);
	await page.click('button:has-text("All")');
	await page.waitForTimeout(300);

	// 2c. Meal modal shows appliances
	await page.locator('h3').first().click();
	const modalText = await page.locator('body').innerText();
	check('meal modal shows appliances', /Uses:/.test(modalText));
	await page.click('button:has-text("Close")');

	// 3. Go to shopping list, mark an item purchased
	await page.goto(`${APP}/shopping-list`, { waitUntil: 'networkidle' });
	const boxes = page.locator('input[type=checkbox]');
	const count = await boxes.count();
	check('shopping list has items', count > 0);
	if (count === 0) {
		const body = await page.locator('body').innerText();
		console.log('--- shopping-list body (no checkboxes) ---');
		console.log(body);
	}
	await boxes.first().check();
	check('checkbox checked', await boxes.first().isChecked());

	// 3b. Shopping list totals bar + used-in collapse
	const shopText = await page.locator('body').innerText();
	check('shopping list shows totals', /Estimated total/.test(shopText));
	check('shopping list shows used-in', /Used in/.test(shopText));

	// 3c. Download as text produces a file
	const downloadPromise = page.waitForEvent('download');
	await page.click('button:has-text("Share / Download")');
	const download = await downloadPromise;
	check('shopping list downloads as text', download.suggestedFilename().endsWith('.txt'));

	// 4. Full reload — plan persists via IndexedDB, checkbox persists
	await page.reload({ waitUntil: 'networkidle' });
	const boxes2 = page.locator('input[type=checkbox]');
	await boxes2.first().waitFor({ timeout: 5000 });
	check('checkbox persists after reload', await boxes2.first().isChecked());

	// 5. Dashboard shows recent plans after reload + budget card
	await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' });
	const recentText = await page.locator('body').innerText();
	check('dashboard shows recent plans', /Week of|Recent Plans/.test(recentText));
	check('dashboard shows budget status', /Within budget|Over budget/.test(recentText));

	// 5b. Nutrition page shows goal status + progress bars
	await page.goto(`${APP}/nutrition`, { waitUntil: 'networkidle' });
	const nutritionText = await page.locator('body').innerText();
	check('nutrition shows goal status', /goal|target/i.test(nutritionText));
	check('nutrition shows progress rings', await page.locator('.radial-progress').count() >= 4);

	// 6. Landing page redirects to /dashboard once a plan exists; header shows logo image
	await page.goto(`${APP}/`, { waitUntil: 'networkidle' });
	await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
	check('landing -> dashboard redirect', page.url().includes('/dashboard'));
	check('header shows logo image', (await page.locator('img[src="/logo_name.png"]').count()) > 0);

	// 7. Offline: only meaningful with a registered service worker (production build).
	//    In dev mode (no SW), skip and note that this must run against a production server.
	await page.goto(`${APP}/meal-plan`, { waitUntil: 'networkidle' });
	const swControlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
	if (!swControlled) {
		console.log('SKIP: offline meal-plan renders (no service worker in dev mode; run against a production build)');
	} else {
		await context.setOffline(true);
		await page.goto(`${APP}/meal-plan`, { waitUntil: 'domcontentloaded' }).catch(() => {});
		const offlineBody = await page.locator('body').innerText().catch(() => '');
		check('offline meal-plan renders', /Weekly Meal Plan/.test(offlineBody));
	}

	console.log(results.join('\n'));
	const failed = results.filter((r) => r.startsWith('FAIL')).length;
	await browser.close();
	process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
	console.error('ERROR:', e.message);
	process.exit(1);
});