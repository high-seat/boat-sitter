import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db";
import { supportRequests } from "../db/schema";

export const supportRouter = new Hono<{ Bindings: Env }>();

const schema = z.object({
  topic: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

supportRouter.post("/", zValidator("json", schema), async (c) => {
  const db = getDb(c.env);
  const createdAt = new Date().toISOString();
  const [row] = await db
    .insert(supportRequests)
    .values({ id: `support-${Date.now()}`, ...c.req.valid("json"), createdAt })
    .returning();
  // Frontend SupportRequest has no id field; return the shape it expects.
  return c.json({
    data: {
      topic: row.topic,
      name: row.name,
      email: row.email,
      message: row.message,
      createdAt: row.createdAt,
    },
  });
});
