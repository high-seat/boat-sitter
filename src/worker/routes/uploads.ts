import { Hono } from "hono";
import type { AppEnv } from "../context";
import { requireUser } from "../middleware/auth";

/**
 * Image uploads → R2 (`UPLOADS` binding). Falls back with 503 when the bucket
 * is not bound so the SPA can keep a local data-URL.
 */
export const uploadsRouter = new Hono<AppEnv>();

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2_500_000;

uploadsRouter.post("/", requireUser, async (c) => {
  const bucket = c.env.UPLOADS;
  if (!bucket) {
    return c.json(
      { error: "UPLOADS_NOT_CONFIGURED", detail: "R2 UPLOADS binding is missing" },
      503,
    );
  }

  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return c.json({ error: "Expected multipart/form-data" }, 400);
  }

  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return c.json({ error: "file field required" }, 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return c.json({ error: "INVALID_TYPE" }, 400);
  }
  if (file.size > MAX_BYTES) {
    return c.json({ error: "TOO_LARGE" }, 400);
  }

  const user = c.get("user")!;
  const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const key = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = await file.arrayBuffer();

  await bucket.put(key, bytes, {
    httpMetadata: { contentType: file.type },
    customMetadata: { uploadedBy: user.id },
  });

  return c.json({ data: { key, url: `/api/files/${encodeURIComponent(key)}` } });
});

export const filesRouter = new Hono<AppEnv>();

filesRouter.get("/:key{.+}", async (c) => {
  const bucket = c.env.UPLOADS;
  if (!bucket) return c.json({ error: "UPLOADS_NOT_CONFIGURED" }, 503);

  const key = decodeURIComponent(c.req.param("key"));
  const object = await bucket.get(key);
  if (!object) return c.json({ error: "Not found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
});
