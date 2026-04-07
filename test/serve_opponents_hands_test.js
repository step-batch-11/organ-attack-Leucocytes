import { beforeEach, describe, it } from "@std/testing/bdd";
import { serveOpponentHand } from "../src/handlers/serve_opponents_hands.js";
import { assertEquals } from "@std/assert";

describe("serveOpponentHand", () => {
  let ctx;
  let games;
  let cookie;

  beforeEach(() => {
    cookie = "roomID=1";
    games = {
      1: {
        getPlayer: () => ({
          attackCards: [
            { name: "card1", type: "affliction" },
            { name: "card2", type: "cure" },
            { name: "card3", type: "tactical" },
            { name: "card4", type: "bureaucracy" },
            { name: "card5", type: "vaccine" },
          ],
          id: 100,
          name: "someone",
        }),
      },
    };

    ctx = {
      games,

      req: {
        raw: {
          headers: {
            get() {
              return cookie;
            },
          },
        },
        json() {
          return { opponentID: 1 };
        },
      },

      get() {
        return games;
      },

      json(json) {
        return json;
      },
    };
  });

  it("should return attackCards, id, name of mock player with mock ctx", async () => {
    const res = await serveOpponentHand(ctx);
    const attackCards = [
      { name: "card1", type: "affliction" },
      { name: "card2", type: "cure" },
      { name: "card3", type: "tactical" },
      { name: "card4", type: "bureaucracy" },
      { name: "card5", type: "vaccine" },
    ];

    assertEquals(res.attackCards, attackCards);
    assertEquals(res.id, 100);
    assertEquals(res.name, "someone");
  });
});
