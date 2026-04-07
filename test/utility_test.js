import { beforeEach, describe, it } from "@std/testing/bdd";
import { getPlayerID } from "../src/utils.js";
import { assertEquals } from "@std/assert";

describe("utility: getPlayerID", () => {
  let ctx;
  let rooms;
  let cookie;

  beforeEach(() => {
    cookie = "sessionID=1; roomID=1";
    const session = { 1: "Alpha" };
    rooms = { 1: [{ name: "Alpha", id: 1 }, { name: "Beta", id: 2 }] };

    ctx = {
      session,
      rooms,

      req: {
        raw: {
          headers: {
            get() {
              return cookie;
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
    const playerID = getPlayerID(ctx);
    assertEquals(playerID, 1);
  });
  it("should return mocked playerID: -1", () => {
    cookie = "roomID=1";
    const playerID = getPlayerID(ctx);
    assertEquals(playerID, -1);
  });
});
