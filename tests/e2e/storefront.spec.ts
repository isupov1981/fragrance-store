import { expect, test } from "@playwright/test";

test("customer can browse a product and add it to cart", async ({ page }) => {
  await page.goto("/products/amber-veil", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Amber Veil/i })).toBeVisible();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page.getByRole("button", { name: /added to cart/i })).toBeVisible();
  await page.goto("/cart", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Amber Veil").first()).toBeVisible();
});

test("static support pages and SEO endpoints respond", async ({ page, request }) => {
  await page.goto("/faq");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
  expect((await request.get("/robots.txt")).ok()).toBeTruthy();
});
