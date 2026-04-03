import { beforeEach, describe, it } from "@std/testing/bdd";
import { getPlayerId } from "../src/utils.js";
import { assertEquals } from "@std/assert";

describe("utility: getPlayerId", () => {
  /*
  getCookie : sessionId roomID

  context
    get : session
    get : rooms

  session : {sessionID: playername}
  rooms : {roomID: players}
   */
  let ctx;
  let rooms;

  beforeEach(() => {
    const session = { 1: "Alpha" };
    rooms = { 1: [{ name: "Alpha", id: 1 }, { name: "Beta", id: 2 }] };

    ctx = {
      session,
      rooms,

      req: {
        raw: {
          headers: {
            get() {
              return "sessionID=1; roomID=1";
            },
          },
        },
      },
      get(name) {
        return this[name];
      },
    };
  });

  it("should return mocked playerID: 1", () => {
    const playerID = getPlayerId(ctx);
    assertEquals(playerID, 1);
  });
  it("should return mocked playerID: -1", () => {
    rooms[1][1].id = 101;
    const playerID = getPlayerId(ctx);
    assertEquals(playerID, 1);
  });
});
