import { assertEquals } from "@std/assert";
import { it } from "@std/testing/bdd";
import { app } from "../src/app.js";

it("app file runs correctly", () => {
  assertEquals(app(), true);
});
