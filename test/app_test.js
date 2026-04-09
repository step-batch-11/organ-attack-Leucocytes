import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { createApp } from "../src/app.js";
import { counter } from "../src/utils.js";

describe("tests for app", () => {
  const logger = () => (_, next) => {
    return next();
  };
  describe("/login", () => {
    let session;
    let idGenerator;
    let playerIDGenerator;
    let app;
    let roomIDGenerator;
    let rooms;
    let games;
    const playersList = [];
    const shuffle = (x) => x;

    beforeEach(() => {
      session = { "1": 1 };
      idGenerator = counter();
      playerIDGenerator = counter();
      roomIDGenerator = counter();
      rooms = { 101: [{ id: 1, name: "chiru" }] };
      games = {};
      app = createApp({
        session,
        players: playersList,
        idGenerator,
        playerIDGenerator,
        roomIDGenerator,
        rooms,
        shuffle,
        games,
      }, logger);
    });
    it("should return login.html when i don't have a cookie", async () => {
      const response = await app.request("/");
      const location = response.headers.get("location");

      assertEquals(response.status, 302);
      assertEquals(location, "/pages/login.html");
    });

    it("it should set a cookie when i login and redirect me to /", async () => {
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
        "sessionID=1; Max-Age=7200; Path=/",
      );
    });

    it("it should set a cookie unique cookies when different users login ", async () => {
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
        "sessionID=2; Max-Age=7200; Path=/",
      );
    });

    it("it shouldn't set a cookie when i login with an invalid username", async () => {
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

    it("should return index page if cookie is there", async () => {
      const response = await app.request("/", {
        headers: new Headers({ "Cookie": "sessionID=1" }),
      });
      const contentType = response.headers.get("content-type");
      response.text();
      assertEquals(contentType, "text/html; charset=utf-8");
      assertEquals(response.status, 200);
    });

    it("should restrict when i try to access login.html when i already logged in ", async () => {
      const response = await app.request("/pages/login.html", {
        headers: new Headers({
          "Cookie": "sessionID=1",
        }),
      });
      const location = response.headers.get("location");
      assertEquals(location, "/home_page.html");
      assertEquals(response.status, 302);
    });

    it("app shouldn't restrict when i try to access login.html when i am not logged in ", async () => {
      const response = await app.request("/pages/login.html");
      const contentType = response.headers.get("content-type");
      await response.text();

      assertEquals(response.status, 200);
      assertEquals(contentType, "text/html; charset=utf-8");
    });

    it("app should send players data and roomID", async () => {
      const formData = new FormData();
      formData.append("username", "user1");
      const response1ToAddUser = await app.request("/login", {
        method: "POST",
        body: formData,
      });
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
      assertEquals(response.status, 302);
      assertEquals(contentType, "application/json");

      const body = await response.json();
      assertEquals(body, {
        players: [{ id: 1, name: "chiru" }],
        myID: 1,
        roomID: "101",
        redirectPath: "/game-page",
      });
    });

    it("app should redirect to game page when it get max players (ex :2)", async () => {
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

      const response = await app.request("/get-players", {
        method: "GET",
        headers: { cookie: "sessionID=1;roomID=101" },
      });
      const body = await response.json();
      assertEquals(body, {
        players: [
          { id: 1, name: "chiru" },
        ],
        myID: 1,
        roomID: "101",
        redirectPath: "/game-page",
      });
    });
  });

  describe("get: /game-state test", () => {
    let session;
    let app;
    let rooms;
    let games;

    beforeEach(() => {
      session = { "1": "chiru" };
      rooms = { 101: [{ name: "chiru", id: 1 }] };
      games = {
        101: {
          getGameState() {
            return { data: "dummy game state" };
          },
          getPlayer() {
            return 1;
          },
        },
      };
      app = createApp({
        session,
        rooms,
        games,
      }, logger);
    });

    it("should return a dummy game state", async () => {
      const headers = new Headers();
      headers.append("Cookie", "sessionID=1; roomID=101");
      const res = await app.request("/game-state", { headers });
      const body = await res.json();

      assertEquals(body, { self: 1, data: "dummy game state", status: true });
    });
    it("should return a failing status as game does not exist ", async () => {
      const headers = new Headers();
      headers.append("Cookie", "sessionID=3; roomID=104");
      const res = await app.request("/game-state", { headers });
      const body = await res.json();

      assertEquals(body, {
        message: "Game not found",
        status: false,
      });
    });
  });
});
