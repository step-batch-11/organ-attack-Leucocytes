import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";
import { counter } from "../src/utils.js";

import { mockGame } from "../src/mock_game_state.js";

describe("tests for app", () => {
  const logger = () => (_, next) => {
    return next();
  };
  describe("/login", () => {
    let session;
    let idGenerator;
    let playerIdGenerator;
    let app;
    let roomIdGenerator;
    let rooms;
    let games;
    const shuffle = (x) => x;

    beforeEach(() => {
      session = { "1": "chiru" };
      idGenerator = counter();
      playerIdGenerator = counter();
      roomIdGenerator = counter();
      rooms = { 101: [] };
      games = {};
      app = createApp({
        session,
        idGenerator,
        playerIdGenerator,
        roomIdGenerator,
        rooms,
        shuffle,
        games,
      }, logger);
    });
    it("=> should return login.html when i don't have a cookie", async () => {
      const response = await app.request("/");
      const location = response.headers.get("location");

      assertEquals(response.status, 302);
      assertEquals(location, "/pages/login.html");
    });

    it(" => it should set a cookie when i login and redirect me to /", async () => {
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
      assertEquals(
        cookie,
        "sessionID=1; Max-Age=7200; Path=/, roomID=101; Max-Age=7200; Path=/",
      );
    });

    it(" => it should set a cookie unique cookies when different users login ", async () => {
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
      assertEquals(
        cookie,
        "sessionID=2; Max-Age=7200; Path=/, roomID=101; Max-Age=7200; Path=/",
      );
    });

    it(" => it shouldn't set a cookie when i login with an invalid username", async () => {
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

    it("=> should return index page if cookie is there", async () => {
      const response = await app.request("/", {
        headers: new Headers({
          "Cookie": "sessionID=1",
        }),
      });
      const contentType = response.headers.get("content-type");
      response.text();
      assertEquals(contentType, "text/html; charset=utf-8");
      assertEquals(response.status, 200);
    });

    it("=> should restrict when i try to access login.html when i already logged in ", async () => {
      const response = await app.request("/pages/login.html", {
        headers: new Headers({
          "Cookie": "sessionID=1",
        }),
      });
      const location = response.headers.get("location");
      assertEquals(location, "/");
      assertEquals(response.status, 302);
    });

    it("=> app shouldn't restrict when i try to access login.html when i am not logged in ", async () => {
      const response = await app.request("/pages/login.html");
      const contentType = response.headers.get("content-type");
      await response.text();

      assertEquals(response.status, 200);
      assertEquals(contentType, "text/html; charset=utf-8");
    });

    it("=> app should send players data ", async () => {
      games[0] = mockGame();

      const response = await app.request("/players-data", {
        method: "GET",
        headers: { cookie: "sessionID=1;roomID=101" },
      });
      const contentType = response.headers.get("content-type");

      assertEquals(response.status, 200);
      assertEquals(contentType, "application/json");
    });

    it(" app should not send player data if there is no sessionId", async () => {
      const response = await app.request("/players-data", {
        method: "GET",
      });
      const contentType = response.headers.get("content-type");

      assertEquals(response.status, 400);
      assertEquals(contentType, "text/plain; charset=UTF-8");
    });
    it("=> app should send players data and roomId", async () => {
      const formData = new FormData();
      formData.append("username", "user1");
      const response1ToAddUser = await app.request("/login", {
        method: "POST",
        body: formData,
      });
      assertEquals(
        response1ToAddUser.headers.getSetCookie()[1],
        "roomID=101; Max-Age=7200; Path=/",
      );
      assertEquals(
        response1ToAddUser.headers.getSetCookie()[0],
        "sessionID=1; Max-Age=7200; Path=/",
      );
      assertEquals(response1ToAddUser.status, 302);

      const response = await app.request("/get-players", {
        method: "GET",
        headers: { cookie: "sessionID=1;roomID=101" },
      });
      const contentType = response.headers.get("content-type");
      assertEquals(response.status, 200);
      assertEquals(contentType, "application/json");
      const body = await response.json();
      assertEquals(body.status, 200);
      assertEquals(body["roomID"], "101");
      assertEquals(body.players.length, 1);
    });

    it("app should redirect to game page when it get max players (ex :6)", async () => {
      const formData1 = new FormData();
      formData1.append("username", "user1");
      await app.request("/login", {
        method: "POST",
        body: formData1,
      });

      const formData2 = new FormData();
      formData2.append("username", "user2");
      await app.request("/login", {
        method: "POST",
        body: formData2,
      });
      const formData3 = new FormData();
      formData3.append("username", "user3");
      await app.request("/login", {
        method: "POST",
        body: formData3,
      });
      const formData4 = new FormData();
      formData4.append("username", "user4");
      await app.request("/login", {
        method: "POST",
        body: formData4,
      });
      const formData5 = new FormData();
      formData5.append("username", "user5");
      await app.request("/login", {
        method: "POST",
        body: formData5,
      });
      const formData6 = new FormData();
      formData6.append("username", "user6");
      await app.request("/login", {
        method: "POST",
        body: formData6,
      });

      const response = await app.request("/get-players", {
        method: "GET",
        headers: { cookie: "sessionID=1;roomID=101" },
      });
      const body = await response.json();
      assertEquals(body.status, 302);
      assertEquals(body.redirectPath, "/game-page");
      assertEquals(body.players.length, 6);
      assertEquals(body.myId, 1);
    });
  });
});
