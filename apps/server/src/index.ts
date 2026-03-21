import { trpcServer } from "@hono/trpc-server";
import { createContext, t } from "@npanel/api";
import { appRouter } from "@npanel/api/routers/index";
import { auth } from "@npanel/auth";
import { env } from "@npanel/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

const appCaller = t.createCallerFactory(appRouter);

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, honoContext) => {
      return createContext({
        context: honoContext,
        createCaller: (ctx) => appCaller(ctx),
      });
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
