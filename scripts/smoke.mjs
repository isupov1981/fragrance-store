const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const paths = ["/en", "/he", "/robots.txt", "/sitemap.xml", "/api/health"];

const failures = [];
for (const path of paths) {
  const url = `${base}${path}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    const ok = response.ok || (response.status >= 300 && response.status < 400);
    if (!ok) failures.push(`${url} → ${response.status}`);
    else console.log(`ok  ${response.status}  ${url}`);
  } catch (error) {
    failures.push(`${url} → ${error instanceof Error ? error.message : "failed"}`);
  }
}

if (failures.length) {
  console.error("Smoke checks failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Smoke checks passed against ${base}`);
