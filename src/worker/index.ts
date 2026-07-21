import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { boatsRouter } from "./routes/boats";
import { devRouter } from "./routes/dev";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("/api/*", cors());

app.get("/api/", (context) =>
  context.json({
    name: "Boatstead API",
    runtime: "Cloudflare Workers",
    status: "ok",
    version: 1,
  }),
);
app.get("/api/health", (context) =>
  context.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
);

app.route("/api/boats", boatsRouter);
app.route("/api/dev", devRouter);

app.notFound((c) =>
  c.req.path.startsWith("/api/") ? c.json({ error: "Not found" }, 404) : c.notFound(),
);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  // Always log the full error — visible via `wrangler tail`.
  console.error("Unhandled error:", err);

  const message = err instanceof Error ? err.message : String(err);

  // A missing table almost always means migrations were not applied to this
  // environment. Say so explicitly rather than making someone read a stack.
  if (/no such table/i.test(message)) {
    return c.json(
      {
        error: "Database not migrated",
        detail: message,
        fix: "Run: npx wrangler d1 migrations apply boat-sitter-db --remote",
      },
      500,
    );
  }

  // Outside production, return the real message so debugging does not require
  // a second terminal running `wrangler tail`.
  if (c.env.ENVIRONMENT !== "production") {
    return c.json({ error: "Internal server error", detail: message }, 500);
  }

  return c.json({ error: "Internal server error" }, 500);
});

export default app;
