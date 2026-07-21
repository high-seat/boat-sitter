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
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
