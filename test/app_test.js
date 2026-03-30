import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";

export const counter = () => {
  let i = 0;
  return () => ++i;
};

describe("tests for app", () => {
  describe("/login", () => {
    it("=> should return login.html when i dont have a cookie", async () => {
      const session = {};
      const idGenerator = counter();

      const app = createApp({ session, idGenerator });

      const response = await app.request("/");
      const location = response.headers.get("location");

      assertEquals(response.status, 302);
      assertEquals(location, "pages/login.html");
    });

    it(" => it should set a cookie when i login", async () => {
      const session = {};
      const idGenerator = counter();

      const app = createApp({ session, idGenerator });
      const formData = new FormData();
      formData.append("username", "user1");
      const response = await app.request("/login", {
        method: "POST",
        body: formData,
      });
      const location = response.headers.get("location");
      const cookie = response.headers.get("set-cookie");

      assertEquals(response.status, 302);
      assertEquals(location, "/");
      assertEquals(cookie, "sessionId=1; Max-Age=7200; Path=/");
    });

    it(" => it should set a cookie unique cookies when different users login ", async () => {
      const session = {};
      const idGenerator = counter();

      const app = createApp({ session, idGenerator });
      const formData1 = new FormData();
      formData1.append("username", "user1");
      await app.request("/login", {
        method: "POST",
        body: formData1,
      });

      const formData2 = new FormData();
      formData2.append("username", "user2");

      const response = await app.request("/login", {
        method: "POST",
        body: formData2,
      });
      const location = response.headers.get("location");
      const cookie = response.headers.get("set-cookie");

      assertEquals(response.status, 302);
      assertEquals(location, "/");
      assertEquals(cookie, "sessionId=2; Max-Age=7200; Path=/");
    });

    it(" => it shouldn't set a cookie when i login with an invalid username", async () => {
      const session = {};
      const idGenerator = counter();

      const app = createApp({ session, idGenerator });
      const formData = new FormData();
      formData.append("username", "");
      const response = await app.request("/login", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      const { message } = await response.json();

      assertEquals(response.status, 401);
      assertEquals(contentType, "application/json");
      assertEquals(message, "invalid username");
    });

    it("=> should redirect to / if cookie is there", async () => {
      const session = { 1: "chiru" };
      const idGenerator = counter();

      const app = createApp({ session, idGenerator });

      const response = await app.request("/", {
        headers: new Headers({
          "Cookie": "sessionId=1",
        }),
      });
      const contentType = response.headers.get("content-type");
      response.text();
      assertEquals(contentType, "text/html; charset=utf-8");
      assertEquals(response.status, 200);
    });
  });
});
