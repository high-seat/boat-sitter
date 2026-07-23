import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { buildAuth } from "./auth";
import type { AppEnv, SessionUser } from "./context";
import { applicationsRouter } from "./routes/applications";
import { availabilityRouter } from "./routes/availability";
import { boatsRouter } from "./routes/boats";
import { addressesRouter } from "./routes/addresses";
import { destinationsRouter } from "./routes/destinations";
import { devRouter } from "./routes/dev";
import { meRouter, profilesRouter } from "./routes/me";
import { notificationsRouter } from "./routes/notifications";
import { prefsRouter } from "./routes/prefs";
import { reviewsRouter } from "./routes/reviews";
import { sitsRouter } from "./routes/sits";
import { supportRouter } from "./routes/support";
import { filesRouter, uploadsRouter } from "./routes/uploads";
import { vesselsRouter } from "./routes/vessels";

const app = new Hono<AppEnv>();

app.use("*", logger());

// Auth needs credentialed CORS. Same-origin in prod (SPA + API on one Worker),
// but this keeps localhost cross-port dev working too.
app.use("/api/*", (c, next) =>
  cors({
    origin: [
      c.env.BETTER_AUTH_URL ?? "http://localhost:5173",
      "http://localhost:5173",
      "http://localhost:4174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:4174",
    ],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })(c, next),
);

// Populate user/session on the context for every request.
app.use("*", async (c, next) => {
  try {
    const auth = buildAuth(c.env, c.req.raw);
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
app.on(["GET", "POST"], "/api/auth/*", (c) => buildAuth(c.env, c.req.raw).handler(c.req.raw));

app.route("/api/me", meRouter);
app.route("/api/profiles", profilesRouter);
app.route("/api/notifications", notificationsRouter);
app.route("/api/reviews", reviewsRouter);

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
app.route("/api/destinations", destinationsRouter);
app.route("/api/addresses", addressesRouter);
app.route("/api/vessels", vesselsRouter);
app.route("/api/sits", sitsRouter);
app.route("/api/applications", applicationsRouter);
app.route("/api/availability", availabilityRouter);
app.route("/api/support", supportRouter);
app.route("/api/prefs", prefsRouter);
app.route("/api/uploads", uploadsRouter);
app.route("/api/files", filesRouter);
app.route("/api/dev", devRouter);

app.notFound((c) =>
  c.req.path.startsWith("/api/") ? c.json({ error: "Not found" }, 404) : c.notFound(),
);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error("Unhandled error:", err);

  const message = err instanceof Error ? err.message : String(err);

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

  if (c.env.ENVIRONMENT !== "production") {
    return c.json({ error: "Internal server error", detail: message }, 500);
  }

  return c.json({ error: "Internal server error" }, 500);
});

export default app;
