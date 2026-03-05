import { test, expect } from '@playwright/test';

test.describe('Authentication & Access', () => {

    test('Member can access login page', async ({ page }) => {
        // Go to the homepage and click the Member Portal link
        await page.goto('/');
        await page.getByRole('link', { name: 'Member Portal' }).click();

        // Should be on the member page showing the login form
        await expect(page).toHaveURL(/member.html/);
        await expect(page.locator('#authContainer')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
    });

    test('Non-admin gets redirected to index or member login when trying to access admin panel', async ({ page }) => {
        // Attempting to visit /admin.html without an active session
        await page.goto('/admin.html');

        // Give it a second for Supabase auth to initialize and redirect
        await page.waitForTimeout(1000);

        // The logic in admin.html redirects to either / or /member.html if you lack permissions
        await expect(page.url()).not.toContain('admin.html');
    });

});
