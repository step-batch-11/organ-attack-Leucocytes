// import { assertEquals, assertNotEquals } from "@std/assert";
// import { beforeEach, describe, it } from "@std/testing/bdd";
// import { createApp } from "../src/app.js";
// import { Game } from "../src/models/game.js";
// import { Player } from "../src/models/player.js";
// import { counter } from "../src/utils.js";
// import { Dealer } from "../src/models/dealer.js";
// import { Deck } from "../src/models/deck.js";
// import { AfflictionHandler } from "../src/models/affliction_handler.js";
// import { TurnManager } from "../src/models/turn_manager.js";

// describe("Testing ChartMixup", () => {
//   let roomID;
//   let players;
//   let app;
//   let game;

//   beforeEach(() => {
//     roomID = 101;
//     const shuffle = (x) => x;
//     const logger = () => (_, next) => {
//       return next();
//     };

//     const session = { "1": "chiru" };
//     const attackCards = new Deck(
//       Array.from(
//         { length: 10 },
//         (_, i) => ({ id: i + 1, type: "affliction" }),
//       ),
//       shuffle,
//     );
//     const organCards = new Deck([{ id: 1, health: 2, isWild: true }], shuffle);
//     const idGenerator = counter();
//     const playerIDGenerator = counter();
//     const roomIDGenerator = counter();
//     const rooms = { 101: [{ name: "chiru", id: 1 }, { name: "kumar", id: 2 }] };
//     const games = {};
//     players = rooms[101].map(({ name, id }) => new Player(name, id));

//     const dealer = new Dealer(attackCards, organCards, players);

//     const afflictionHandler = new AfflictionHandler(attackCards, organCards);
//     const turnManager = new TurnManager(players, 1);
//     game = new Game(
//       players,
//       attackCards,
//       organCards,
//       dealer,
//       afflictionHandler,
//       turnManager,
//     );
//     games[101] = game;
//     game.dealCards();
//     game.setFirstPlayer();
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

//   it("Should perform chartMixup when player play chart mixup card", async () => {
//     const [player1, player2] = players;
//     player1.refillHand({ id: 12, action: "chart-mixup" });
//     player1.refillHand({ id: 12, action: "chart-mixup" });

//     const { attackCards: player1PreAttacks } = player1.getPlayerDetails();
//     const { attackCards: player2PreAttacks } = player2.getPlayerDetails();

//     const response = await app.request("/attack", {
//       method: "post",
//       body: JSON.stringify({
//         attackerID: 1,
//         attackCardID: 12,
//       }),
//       headers: { cookie: `roomID=${roomID}` },
//     });

//     assertEquals(response.status, 200);
//     assertEquals(await response.json(), { success: true });

//     const { attackCards: player1Attacks } = player1.getPlayerDetails();
//     const { attackCards: player2Attacks } = player2.getPlayerDetails();

//     assertNotEquals(player1Attacks, player1PreAttacks);
//     assertNotEquals(player2Attacks, player2PreAttacks);
//   });

//   it("Should return error msg when player play invalid action card", async () => {
//     const [player1] = players;
//     player1.refillHand({ id: 12, action: "invalid-action" });

//     const response = await app.request("/attack", {
//       method: "post",
//       body: JSON.stringify({
//         attackerID: 1,
//         attackCardID: 12,
//       }),
//       headers: { cookie: `roomID=${roomID}` },
//     });

//     assertEquals(response.status, 400);
//     assertEquals(await response.json(), { message: "Invalid action" });
//   });
// });
