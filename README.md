# Study Stakes

A work-tracking game where time at your desk earns chips, and chips buy a floating solarpunk island of businesses, blackjack, video poker, and Kalshi-style prediction markets. Everything is play money.

## Play

Open `index.html` in a browser. No server or install is needed. Progress saves in your browser's local storage.

To host it, enable GitHub Pages for this repo and serve the `main` branch from the root.

## How it works

- **Work to earn.** The timer is measured against the real clock, so a minimized or sleeping tab does not lose time. Start the timer to earn 10 chips a minute, with a focus multiplier that grows to x2 over a long session. Finished tasks, a daily goal and a day streak pay bonuses, and every business you build raises task pay by 10%.
- **Record bonus.** Beating your previous session (if it lasted at least 1:30) earns a bonus that grows with how much longer you go. Stopping asks whether to cash out or keep studying.
- **Tycoon.** Six businesses add chips per minute while the timer runs, and each one appears on the 3D island and upgrades at 3, 6 and 10 owned. The island's centerpiece grows with your total buys, from a sapling to a cabin, workshop, terrace tower, sun tower and finally a floating sun spire.
- **Blackjack.** Pays 3:2, with hit, stand and double.
- **Video poker.** Jacks or better, with a how-to-play guide in the room.
- **Slots and roulette.** Sun Slots (three reels, middle line pays, about 92% return) and a European roulette table with straight, dozen, column and even-money bets. Wins are saved as pending while the reels or wheel are moving, so a reload cannot lose them.
- **Markets.** Every round lasts 5 minutes. Four repeating event questions (one continuous chart each) plus simulated BTC and Gold "above the strike" markets. Contracts pay 100 chips if right, with the Kalshi taker fee formula, 2 / 5 / 10 minute charts, and a fresh strike each round.
- **Sun Guard (tower defense).** Every round has an entry fee that rises each round, and every round brings far more smog than the last. Five towers from easy to advanced, each bought with chips, and every shot uses ammo that also costs chips. Finish a 10-wave round to collect the winning pot: the round prize plus everything you spent on towers and ammo. Every 5th round is a solar-prize round that also pays back the towers on your map. You keep towers and ammo between rounds. Lose and they are all gone. A round in progress is saved across reloads.
- **Chess.** You play White against the house at three levels. Each game has a chip buy-in and every move costs at least 50 chips. The easy opponent is the most expensive and pays least, the hard one is cheapest and pays most. The prize grows to repay any move fees beyond half of it. A draw refunds half of what you paid.

BTC and Gold prices are simulated (stochastic volatility with clustering and jumps), anchored near real levels. They are not live data.

- **Stats menu.** Click the sun next to your chip total to open a stats panel (closed by default) shows chips earned, won back and spent, and where each chip went.

## Project layout

```
src/head.html        title, fonts, styles
src/body.html        page markup
src/js/core.js       state, work timer, tasks, tycoon, saving
src/js/cards.js      blackjack and video poker
src/js/world-a.js    3D island scene (three.js): terrain and buildings
src/js/world-b.js    3D island scene: coins, camera, animation loop
src/js/td.js         Sun Guard tower defense
src/js/chess.js      chess engine and board
src/js/slots.js      slot machine
src/js/roulette.js   roulette table and wheel
src/js/markets.js    prediction markets and startup
build.sh             assembles src/ into index.html
index.html           built standalone page (committed so Pages can serve it)
```

## Build

```
./build.sh
```

This needs `bash` and `node` (for a syntax check). Edit the files in `src/`, rebuild, and commit both `src/` and `index.html`.

The game loads three.js r128 from cdnjs. If it cannot load, the 3D island hides and the rest of the game still works.
