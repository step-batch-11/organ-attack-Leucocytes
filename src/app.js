import { Hono } from "hono";
import { serveStatic } from "hono/deno";

export const createApp = () => {
  const app = new Hono();

  app.use(serveStatic({ root: "public" }));

  return app;
};
