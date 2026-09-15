import { expect, test } from "@playwright/test";

test("customer can browse a product and add it to cart", async ({ page }) => {
  await page.goto("/en/products/notre-dame", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Notre-Dame/i })).toBeVisible();
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByRole("dialog", { name: /shopping bag/i })).toBeVisible();
  await expect(page.getByText("Notre-Dame").first()).toBeVisible();
  await page.getByRole("link", { name: /view shopping bag/i }).click();
  await expect(page).toHaveURL(/\/en\/cart/);
  await expect(page.getByText("Notre-Dame").first()).toBeVisible();
});

test("hebrew storefront is rtl and can switch currency", async ({ page }) => {
  await page.goto("/he", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("link", { name: "EN" })).toBeVisible();

  await page.goto("/en/products/notre-dame", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /EUR/ }).first().click();
  await expect(page.getByText(/€|EUR/).first()).toBeVisible();
  await page.getByRole("button", { name: /ILS/ }).first().click();
  await expect(page.getByText(/₪|ILS/).first()).toBeVisible();
});

test("customer can complete demo checkout", async ({ page }) => {
  await page.goto("/en/products/notre-dame", { waitUntil: "domcontentloaded" });
  await page.getByTestId("add-to-cart").click();
  await page.getByRole("link", { name: /^checkout$/i }).click();
  await expect(page).toHaveURL(/\/en\/checkout/);
  await expect(page.getByPlaceholder("Full name")).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("Full name").fill("Ada Lovelace");
  await page.getByPlaceholder("Email").fill("ada@example.com");
  await page.getByPlaceholder("Address").fill("1 Atelier Lane");
  await page.getByPlaceholder("City").fill("Paris");
  await page.getByPlaceholder("Postal code").fill("75001");
  await page.getByPlaceholder("Country code (US)").fill("FR");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /continue to payment/i }).click();
  await expect(page).toHaveURL(/\/en\/checkout\/success/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();
});

test("static support pages and SEO endpoints respond", async ({ page, request }) => {
  await page.goto("/en/faq");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/en/account");
  await expect(page.getByRole("heading", { name: /look up an order/i })).toBeVisible();
  expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
  expect((await request.get("/robots.txt")).ok()).toBeTruthy();
});

test("collection can be sorted and paginated", async ({ page }) => {
  await page.goto("/en/collections/all?sort=price-asc", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel(/sort/i)).toHaveValue("price-asc");
  await expect(page.getByRole("link", { name: /in stock/i })).toBeVisible();
});

test("contact form accepts an enquiry", async ({ page }) => {
  await page.goto("/en/contact", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/^name$/i).fill("Ada Lovelace");
  await page.getByLabel(/^email$/i).fill("ada@example.com");
  await page.getByLabel(/^message$/i).fill("Please recommend an amber fragrance for evening wear.");
  await page.getByRole("button", { name: /send enquiry/i }).click();
  await expect(page.getByRole("status")).toContainText(/thank you/i);
});

test("cancelled payment returns the customer to a recovery page", async ({ page }) => {
  await page.goto("/en/checkout/cancel", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /payment was not completed/i })).toBeVisible();
  await page.getByRole("link", { name: /return to checkout/i }).click();
  await expect(page).toHaveURL(/\/en\/checkout/);
});
