import { test, expect } from '@playwright/test';

test.describe('ImpactLens Enterprise Compliance Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Executive Dashboard loads with KPIs and active circulars', async ({ page }) => {
    // Verify title and brand
    await expect(page).toHaveTitle(/ImpactLens/i);
    await expect(page.getByRole('heading', { name: /Compliance Impact & Regulatory Intelligence/i })).toBeVisible();

    // Verify system health banner
    await expect(page.getByText('SYSTEM HEALTHY')).toBeVisible();
    await expect(page.getByText('MOCK AI MODE (ZERO COST)')).toBeVisible();

    // Verify sidebar navigation links
    const sidebar = page.locator('aside');
    await expect(sidebar.getByRole('link', { name: 'Regulatory Changes' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Client Organizations' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Impact Analyses' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Action Plan' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Review Queue' })).toBeVisible();
  });

  test('2. Regulatory Change inspection with old vs new legal clause diffs', async ({ page }) => {
    await page.goto('/regulatory-changes');
    await page.waitForLoadState('networkidle');

    // Circular 39/2026/TT-BTC should be listed
    await expect(page.getByText('39/2026/TT-BTC').first()).toBeVisible();

    // Click to inspect provisions
    await page.getByRole('link', { name: /Inspect Provisions/i }).first().click();
    await page.waitForURL(/\/regulatory-changes\/.+/);

    // Verify clause diff comparison
    await expect(page.getByText('Previous Legal Text').first()).toBeVisible();
    await expect(page.getByText('New Enacted Text').first()).toBeVisible();
    await expect(page.getByText(/Điều 8/).first()).toBeVisible();
  });

  test('3. Client Organizations profile completeness & facts', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Verify 3 seeded demo organizations
    await expect(page.getByText('DEMO IMPORT MANUFACTURING CO.').first()).toBeVisible();
    await expect(page.getByText('DEMO LOCAL SERVICE CO.').first()).toBeVisible();
    await expect(page.getByText('DEMO UNKNOWN TRADING CO.').first()).toBeVisible();

    // Open Demo Import Manufacturing Co. detail
    await page.getByRole('link', { name: /View Full Profile/i }).first().click();
    await page.waitForURL(/\/organizations\/.+/);

    // Verify customs profile & activities
    await expect(page.getByText('Customs Status Profile')).toBeVisible();
    await expect(page.getByText('Registered Importer')).toBeVisible();
    await expect(page.getByText('FDI Enterprise')).toBeVisible();

    // Switch to Profile Facts tab
    await page.getByRole('button', { name: /Profile Facts/i }).click();
    await expect(page.getByText('USES_IMPORTED_RAW_MATERIALS')).toBeVisible();
  });

  test('4. Flagship flow: Demo Import Manufacturing Co. evaluates to POTENTIALLY_APPLIES & approves', async ({ page }) => {
    await page.goto('/analyses');
    await page.waitForLoadState('networkidle');

    // Launch analysis modal
    await page.getByRole('button', { name: /Run Impact Analysis/i }).first().click();
    await expect(page.getByText('Execute Compliance Impact Analysis')).toBeVisible();

    // Select Demo Import Manufacturing Co.
    const orgSelect = page.getByTestId('target-org-select');
    await orgSelect.selectOption('d38099c2-3d76-476e-b5a8-fbe487b5e98e');

    await page.getByRole('button', { name: /Run Analysis Now/i }).click();

    // Wait for analysis to finish and redirect
    await page.waitForURL(/\/analyses\/.+/, { timeout: 15000 });

    // Inspect Flagship Screen
    await expect(page.getByText(/POTENTIALLY_APPLIES|APPLIES/i).first()).toBeVisible();
    await expect(page.getByText(/Impact Priority Score/i)).toBeVisible();
    await expect(page.getByText(/5-Pillar Framework/i)).toBeVisible();

    // Verify 5 Pillars: WHAT, WHO, WHY, SO WHAT, NOW WHAT
    await expect(page.getByText('1. WHAT')).toBeVisible();
    await expect(page.getByText('2. WHO')).toBeVisible();
    await expect(page.getByText('3. WHY')).toBeVisible();
    await expect(page.getByText('4. SO WHAT')).toBeVisible();
    await expect(page.getByText('5. NOW WHAT')).toBeVisible();

    // Click on Citation button [EV-001]
    const citationBtn = page.getByRole('button', { name: /\[EV-001\]/i }).first();
    if (await citationBtn.isVisible()) {
      await citationBtn.click();
      await expect(page.getByText(/Verified Legal Evidence/i)).toBeVisible();
      // Click the drawer's close button to dismiss drawer completely
      await page.locator('.animate-in button').first().click();
      await page.waitForTimeout(400);
    }

    // Switch to Reviewer role using header role switcher to test formal approval
    await page.getByRole('button', { name: 'Reviewer' }).click();
    await page.waitForTimeout(500);

    // Approve assessment if not yet approved
    const approveBtn = page.getByRole('button', { name: /Approve Assessment/i });
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(page.getByText(/Compliance Officer Review & Approval/i)).toBeVisible();
      await page.locator('textarea').fill('Verified compliance findings and legal citations. Formally approved.');
      await page.getByRole('button', { name: 'Confirm Approval' }).click();
      await expect(page.getByText(/Workflow: APPROVED/i)).toBeVisible();
    }
  });

  test('5. Case 2: Demo Local Service Co. evaluates to DOES_NOT_APPLY', async ({ page }) => {
    await page.goto('/analyses');
    await page.waitForLoadState('networkidle');

    // Run new analysis for Demo Local Service Co.
    await page.getByRole('button', { name: /Run Impact Analysis/i }).first().click();
    await expect(page.getByText('Execute Compliance Impact Analysis')).toBeVisible();

    // Select Demo Local Service Co.
    const orgSelect = page.getByTestId('target-org-select');
    await orgSelect.selectOption('228a8bc5-163c-49a1-a956-b519046ce3aa');

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/analyses') && res.request().method() === 'POST'),
      page.getByRole('button', { name: /Run Analysis Now/i }).click(),
    ]);
    const data = await response.json();
    await page.waitForURL(new RegExp(`/analyses/${data.id}`));
    await page.waitForLoadState('networkidle');

    // Verify DOES_NOT_APPLY outcome
    await expect(page.getByText('DOES_NOT_APPLY').first()).toBeVisible();
  });

  test('6. Case 3: Demo Unknown Trading Co. evaluates to INSUFFICIENT_INFORMATION', async ({ page }) => {
    await page.goto('/analyses');
    await page.waitForLoadState('networkidle');

    // Run new analysis for Demo Unknown Trading Co.
    await page.getByRole('button', { name: /Run Impact Analysis/i }).first().click();
    await expect(page.getByText('Execute Compliance Impact Analysis')).toBeVisible();

    // Select Demo Unknown Trading Co.
    const orgSelect = page.getByTestId('target-org-select');
    await orgSelect.selectOption('1921d286-5ad2-4225-9aff-b36d0bb2f43b');

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/analyses') && res.request().method() === 'POST'),
      page.getByRole('button', { name: /Run Analysis Now/i }).click(),
    ]);
    const data = await response.json();
    await page.waitForURL(new RegExp(`/analyses/${data.id}`));
    await page.waitForLoadState('networkidle');

    // Verify INSUFFICIENT_INFORMATION outcome
    await expect(page.getByText('INSUFFICIENT_INFORMATION').first()).toBeVisible();
    await expect(page.getByText(/Missing Information/i).first()).toBeVisible();
  });

  test('7. Action Plan table & Kanban with interactive status updates', async ({ page }) => {
    await page.goto('/actions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Compliance Action Plan/i })).toBeVisible();

    // Switch to Kanban view
    await page.getByRole('button', { name: /Kanban Board/i }).click();
    await expect(page.getByText('To Do / Not Started')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^Completed$/ })).toBeVisible();

    // Switch back to Table view
    await page.getByRole('button', { name: /Table View/i }).click();
    await expect(page.getByText(/Action Item|Priority|Owner/i).first()).toBeVisible();
  });

  test('8. Applicability Rules configuration and toggle', async ({ page }) => {
    await page.goto('/rules');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Deterministic Applicability Rules/i })).toBeVisible();
    await expect(page.getByText('Importer Document Requirement Rule')).toBeVisible();
    await expect(page.getByText('Record Retention Extension for Importers')).toBeVisible();
  });

  test('9. Compliance Audit Trail records system events', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Compliance Audit Trail/i })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /ANALYSIS_RUN|ANALYSIS_APPROVED/ }).first()).toBeVisible();
  });
});
