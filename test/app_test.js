import { assertEquals } from "@std/assert";
import { it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";

it("app file runs correctly", async () => {
  const app = createApp();
  const request = await app.request("/");

  assertEquals(request.status, 200);
  assertEquals(request.headers.get("content-type"), "text/html; charset=utf-8");
  await request.text();
});
