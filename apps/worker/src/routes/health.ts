import { Hono } from "hono";

import type { AppBindings } from "../types";

export const healthRoute = new Hono<AppBindings>();

healthRoute.get("/", (c) =>
  c.json({
    status: "ok",
    provider: c.env.SHILA_MODEL_PROVIDER ?? "deepseek",
    time: new Date().toISOString(),
  }),
);
