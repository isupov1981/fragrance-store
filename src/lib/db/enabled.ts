export function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("placeholder"));
}
