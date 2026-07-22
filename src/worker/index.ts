import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { buildAuth } from "./auth";
import type { AppEnv, SessionUser } from "./context";
import { applicationsRouter } from "./routes/applications";
import { boatsRouter } from "./routes/boats";
import { devRouter } from "./routes/dev";
import { sitsRouter } from "./routes/sits";
import { supportRouter } from "./routes/support";
import { vesselsRouter } from "./routes/vessels";

const app = new Hono<AppEnv>();

app.use("*", logger());

// Auth needs credentialed CORS. Same-origin in prod (SPA + API on one Worker),
// but this keeps localhost cross-port dev working too.
app.use("/api/*", (c, next) =>
  cors({
    origin: [c.env.BETTER_AUTH_URL ?? "http://localhost:5173", "http://localhost:5173"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })(c, next),
);

// Populate user/session on the context for every request.
app.use("*", async (c, next) => {
  try {
    const auth = buildAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", (session?.user as SessionUser) ?? null);
    c.set("session", session?.session ?? null);
  } catch {
    // If the auth tables aren't migrated yet, treat as logged out rather than 500.
    c.set("user", null);
    c.set("session", null);
  }
  await next();
});

// Better Auth handles all its own routes (sign-in, callback, session, sign-out).
app.on(["GET", "POST"], "/api/auth/*", (c) => buildAuth(c.env).handler(c.req.raw));

// Convenience: who am I?
app.get("/api/me", (c) => c.json({ user: c.get("user") }));

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
app.route("/api/vessels", vesselsRouter);
app.route("/api/sits", sitsRouter);
app.route("/api/applications", applicationsRouter);
app.route("/api/support", supportRouter);
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
