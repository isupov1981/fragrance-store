import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createObjectKey, resolveStoredPath } from "./validate";

export function localUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
}

export function localPublicUrl(key: string, origin: string) {
  return `${origin.replace(/\/$/, "")}/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function absoluteUploadPath(key: string) {
  const { key: safe } = resolveStoredPath(localUploadRoot(), key);
  const absolute = path.resolve(localUploadRoot(), ...safe.split("/"));
  const root = localUploadRoot() + path.sep;
  if (absolute !== localUploadRoot() && !absolute.startsWith(root)) {
    throw new Error("Invalid object key");
  }
  return absolute;
}

export async function putLocalObject(input: { body: Buffer; contentType: string; origin: string }) {
  const key = createObjectKey(input.contentType);
  const absolute = absoluteUploadPath(key);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, input.body);
  return { key, url: localPublicUrl(key, input.origin) };
}
