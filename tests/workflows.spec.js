import { test, expect } from '@playwright/test';

test.describe('Event Platform Workflows', () => {

    // Test 1: Event list loads successfully
    test('Public event list loads and displays events', async ({ page }) => {
        await page.goto('/');

        // Wait for the main elements to ensure page is loaded
        await expect(page.locator('h1')).toBeVisible();

        // Optional: wait for Supabase data to load into the DOM
        // The events are usually populated dynamically
        await page.waitForTimeout(1500);

        // Check if the Event section exists
        await expect(page.locator('#experiences')).toBeVisible();
        await expect(page.getByText('Upcoming Experiences')).toBeVisible();
    });

    // Test 2: Admin Access Restricted
    test('Non-admin gets redirected from admin panel', async ({ page }) => {
        await page.goto('/admin.html');

        // Will be redirected to login/member page if not authenticated
        await page.waitForTimeout(1500);
        await expect(page.url()).not.toContain('admin.html');
    });

    // Test 3: Member Portal Login Page Loads
    test('Member portal login page is accessible', async ({ page }) => {
        await page.goto('/member.html');

        // Auth Container should be visible
        await expect(page.locator('#authContainer')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
    });

});
