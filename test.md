TAP version 14

# ./test/app_test.js

# Subtest: tests for app

    ok 1 - should return login.html when i don't have a cookie
    ok 2 - it should set a cookie when i login and redirect me to /
    ok 3 - it should set a cookie unique cookies when different users login 
    ok 4 - it shouldn't set a cookie when i login with an invalid username
    ok 5 - should return index page if cookie is there
    ok 6 - should restrict when i try to access login.html when i already logged in 
    ok 7 - app shouldn't restrict when i try to access login.html when i am not logged in 
    ok 8 - app should send players data and roomID
    ok 9 - app should redirect to game page when it get max players (ex :2)
    ok 10 - /login
    ok 11 - should return a dummy game state
    ok 12 - should return a failing status as game does not exist 
    ok 13 - get: /game-state test
    1..13

ok 1 - tests for app

# ./test/by_the_book_test.js

# Subtest: Testing By the book

    ok 1 - Should discard all non affliction cards of all players
    1..1

ok 2 - Testing By the book

# ./test/chart_mixup_test.js

# Subtest: Testing ChartMixup

    ok 1 - Should perform chartMixup when player play chart mixup card
    ok 2 - Should return error msg when player play invalid action card
    1..2

ok 3 - Testing ChartMixup

# ./test/controller-test/action_controller_test.js

# Subtest: ActionController

    ok 1 - should add new action in actionController
    ok 2 - should fail to add IMMUNITY_BOOST as first action
    ok 3 - should fail to add METASTASIS as first action
    ok 4 - should fail to add CONTAGIOUS as first action
    ok 5 - should add CONTAGIOUS after AFFLICTION
    ok 6 - should not add CONTAGIOUS after IMMUNITY_BOOST
    ok 7 - Adding Action in Action Controller
    ok 8 - should resolve the action
    ok 9 - should not resolve any action as its stack is EMPTY
    ok 10 - should consume all the actions as it is [ AFFLICTION , IMMUNITY_BOOST ]
    ok 11 - should consume last two [ AFFLICTION , IMMUNITY_BOOST, IMMUNITY_BOOST ]
    ok 12 - should return [ AFFLICTION , CONTAGIOUS ]
    ok 13 - Resolving Action in ActionController
    1..13

ok 4 - ActionController

# ./test/controller-test/game_controller_test.js

# ./test/game_setup_test.js

# Subtest: Game setup tests

    ok 1 - Game setup should return given players
    ok 2 - Game setup with invalid room id should return 'bad request' response
    1..2

ok 5 - Game setup tests

# ./test/game_test.js

# Subtest: Game model test

    ok 1 - Should return the players' details
    ok 2 - Should return the players' details providing wild organ
    ok 3 - Should return the index of firstPlayer
    ok 4 - * GetPlayers test
    ok 5 - Should distribute 5 attack cards to each players
    ok 6 - Should distribute 4 attack cards to each players
    ok 7 - Should distribute 5 attack cards and 4 organ cards for 2 players
    ok 8 - Should distribute 5 attack cards to each players
    ok 9 - Should distribute 5 attack cards to each players
    ok 10 - Testing Cards Distributor
    1..10

ok 6 - Game model test

# ./test/hybrid_affliction_test.js

# Subtest: Testing Hybrid affliction

    ok 1 - should afflict an organ
    ok 2 - should remove an organ
    1..2

ok 7 - Testing Hybrid affliction

# ./test/its_alive_card_handler_test.js

# Subtest: Game model test

    ok 1 -  Should return reanimated organ
    1..1

ok 8 - Game model test

# ./test/its_alive_test.js

# Subtest: Game model test

    ok 1 - Should return reanimated organ
    1..1

ok 9 - Game model test

# ./test/medicine_test.js

# Subtest: should test handleMedicine

    ok 1 - should heal organ
    1..1

ok 10 - should test handleMedicine

# ./test/necrosis_test.js

# Subtest: Testing Necrosis

    ok 1 - Should discard all non affliction cards of all players
    1..1

ok 11 - Testing Necrosis

# ./test/normal_affliction_test.js

# Subtest: Testing Normal Affliction

    ok 1 - Should afflict an organ of player with given IDs
    ok 2 - Should remove an organ of player with given IDs
    1..2

ok 12 - Testing Normal Affliction

# ./test/organ_test.js

# Subtest: organ class

    ok 1 -  organDetails
    ok 2 - Afflict
    ok 3 - Cure
    ok 4 - Is wild
    ok 5 - Is dead
    ok 6 - Get details
    1..6

ok 13 - organ class

# ./test/player_test.js

# Subtest: Testing Player Class

    ok 1 - Should Initiate player and return their details
    ok 2 - Should Initiate one more player and return their details
    ok 3 - Should fill Hand with given attack cards
    ok 4 - Should fill Hand with given organs cards
    ok 5 - Should discard all attack cards
    ok 6 - Should have wild card
    ok 7 - Should return player id
    ok 8 - Should return player details
    ok 9 - Should remove an attack card from hand
    ok 10 - Should remove an organ card of player since its current health is 1
    ok 11 - Should remove organ
    ok 12 - Should add organ
    1..12

ok 14 - Testing Player Class

# ./test/poison_test.js

# Subtest: Testing Necrosis

    ok 1 - Should discard all non affliction cards of all players
    1..1

ok 15 - Testing Necrosis

# ./test/removal_affliction_test.js

# Subtest: Resting Removal affliction

    ok 1 - Should remove given organ
    1..1

ok 16 - Resting Removal affliction

# ./test/transplant_test.js

# Subtest: should test handleTransplant

    ok 1 - should transplant organ
    1..1

ok 17 - should test handleTransplant

# ./test/turn_manager_test.js

# Subtest: tests for turn manager

    ok 1 - should return the turn to immediate next player since no one is sleeping
    ok 2 - should skip the sleeping player and pass on.
    ok 3 - should skip the sleeping player and pass on a single player.
    ok 4 - should skip the sleeping player and pass on many players.
    ok 5 - should skip the sleeping players and pass on many players and loop back to me
    ok 6 - should skip the sleeping players twice and pass on all players and loop back to me
    ok 7 - should skip the sleeping players twice and pass on all players and loop back to me
    1..7

ok 18 - tests for turn manager

# ./test/utility_test.js

# Subtest: utility: getPlayerID

    ok 1 - should return mocked playerID: 1
    ok 2 - should return mocked playerID: -1
    1..2

ok 19 - utility: getPlayerID

# ./test/vaccine_test.js

# Subtest: Game model test

    ok 1 - should increase vaccine pts to 2 when I played vaccine card
    ok 2 - should increase vaccine pts to 4 when I played vaccine card twice
    ok 3 - should decrease vaccine pts by 1 when someone hit me once
    ok 4 - should decrease vaccine pts by 2 when someone hit me twice
    ok 5 - should affilct my organ when some one hit me thrice after i got vaccinated
    ok 6 - * GetPlayers test
    1..6

ok 20 - Game model test 1..20
