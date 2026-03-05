import { test, expect } from '@playwright/test';

test.describe('Member Dashboard Workflows', () => {

    // Test: Member dashboard loads and shows events
    test('Member dashboard loads successfully (requires auth setup)', async ({ page }) => {
        // Note: In a real CI environment, you would inject a member session here

        // Navigate to the member dashboard
        await page.goto('/member.html');

        // Check if the member dashboard element is visible
        // (If not logged in, it will show the auth container instead)
        await expect(page.locator('#membersDashboard')).toBeVisible({ timeout: 5000 });

        // Verify the stats or greeting exists
        await expect(page.locator('#memberGreeting')).toBeVisible();
        await expect(page.locator('#availableEventsGrid')).toBeVisible();
    });

});
