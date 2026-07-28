// import { assertEquals } from "@std/assert";
// import { beforeEach, describe, it } from "@std/testing/bdd";
// import { createApp } from "../src/app.ts";
// import { counter } from "../src/utils.ts";
// import { Game } from "../src/models/game.ts";
// import { Player } from "../src/models/player.ts";
// import { Deck } from "../src/models/deck.ts";
// import { AfflictionHandler } from "../src/models/affliction_handler.ts";
// import { Dealer } from "../src/models/dealer.ts";
// import { Organ } from "../src/models/organ.ts";

// describe("should test handleMedicine", () => {
//   let roomID;
//   let players;
//   let shuffle;
//   let session;
//   let idGenerator;
//   let playerIDGenerator;
//   let roomIDGenerator;
//   let rooms;
//   let games;
//   let game;
//   let app;

//   const logger = () => (_, next) => {
//     return next();
//   };

//   beforeEach(() => {
//     roomID = 101;
//     shuffle = (x) => x;
//     const attackCards = new Deck(
//       Array.from(
//         { length: 10 },
//         (_, i) => ({
//           id: i + 1,
//           action: "medicine",
//           type: "cure",
//           afflictableOrgans: [],
//         }),
//       ),
//       shuffle,
//     );
//     const organCards = new Deck(
//       [{ id: 1, health: 2 }, { id: 2, health: 2 }, {
//         id: 3,
//         health: 2,
//       }, { id: 4, health: 2 }].map(({ id, health }) =>
//         new Organ("o" + id, id, health)
//       ),
//       shuffle,
//     );
//     rooms = { 101: [{ name: "chiru", id: 1 }, { name: "kumar", id: 2 }] };
//     games = {};

//     players = rooms[roomID].map(({ name, id }) => new Player(name, id));
//     players.map((player) => {
//       player.fillHandWithOrgans([new Organ("", 1, 1)]);
//       player.fillHandWithAttacks([{
//         id: 1,
//         action: "medicine",
//         afflictableOrgans: [1],
//       }]);
//     });
//     const dealer = new Dealer(attackCards, organCards, players);

//     const afflictionHandler = new AfflictionHandler(attackCards, organCards);

//     session = { "1": "chiru" };
//     idGenerator = counter();
//     playerIDGenerator = counter();
//     roomIDGenerator = counter();
//     game = new Game(
//       players,
//       attackCards,
//       organCards,
//       dealer,
//       afflictionHandler,
//     );
//     // game.dealCards();
//     game.setFirstPlayer();
//     games[101] = game;

//     app = createApp({
//       session,
//       idGenerator,
//       playerIDGenerator,
//       roomIDGenerator,
//       rooms,
//       shuffle,
//       games,
//     }, logger);
//   });
//   it("should heal organ", async () => {
//     const res = await app.request("/attack", {
//       method: "post",
//       body: JSON.stringify({
//         attackerID: 1,
//         opponentID: 1,
//         attackCardID: 1,
//         organCardID: 1,
//         isInstant: false,
//       }),
//       headers: { cookie: "roomID=101" },
//     });

//     assertEquals(res.status, 200);
//     const { success } = await res.json();
//     assertEquals(success, true);
//   });
// });
