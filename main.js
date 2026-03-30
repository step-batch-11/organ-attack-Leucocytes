import { createApp } from "./src/app.js";

export const counter = () => {
  let i = 0;
  return () => ++i;
};

const main = () => {
  const session = {};
  const idGenerator = counter();

  const app = createApp({ session, idGenerator });
  const port = Deno.env.get("PORT") || 8000;

  Deno.serve({ port }, app.fetch);
};
main();
