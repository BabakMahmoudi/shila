import { Hono } from "hono";
import { cors } from "hono/cors";

import { chatRoute } from "./routes/chat";
import { healthRoute } from "./routes/health";
import type { AppBindings } from "./types";

const app = new Hono<AppBindings>();

app.use("*", cors());

app.route("/health", healthRoute);
app.route("/chat", chatRoute);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default app;
