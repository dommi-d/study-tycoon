# Study Stakes

A work-tracking game where time at your desk earns chips, and chips buy a floating solarpunk island of businesses, blackjack, video poker, and Kalshi-style prediction markets. Everything is play money.

## Play

Open `index.html` in a browser. No server or install is needed. Progress saves in your browser's local storage.

To host it, enable GitHub Pages for this repo and serve the `main` branch from the root.

## How it works

- **Work to earn.** Start the timer to earn 10 chips a minute, with a focus multiplier that grows to x2 over a long session. Finished tasks, a daily goal and a day streak pay bonuses.
- **Tycoon.** Six businesses add chips per minute while the timer runs, and each one appears on the 3D island and upgrades at 3, 6 and 10 owned. The island's centerpiece grows with your total buys, from a sapling to a cabin, workshop, terrace tower, sun tower and finally a floating sun spire.
- **Blackjack.** Pays 3:2, with hit, stand and double.
- **Video poker.** Jacks or better, with a how-to-play guide in the room.
- **Markets.** Every round lasts 5 minutes. Four repeating event questions (one continuous chart each) plus simulated BTC and Gold "above the strike" markets. Contracts pay 100 chips if right, with the Kalshi taker fee formula, 2 / 5 / 10 minute charts, and a fresh strike each round.

BTC and Gold prices are simulated (stochastic volatility with clustering and jumps), anchored near real levels. They are not live data.

## Project layout

```
src/head.html        title, fonts, styles
src/body.html        page markup
src/js/core.js       state, work timer, tasks, tycoon, saving
src/js/cards.js      blackjack and video poker
src/js/world-a.js    3D island scene (three.js): terrain and buildings
src/js/world-b.js    3D island scene: coins, camera, animation loop
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
