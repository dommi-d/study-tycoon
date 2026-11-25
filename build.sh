#!/usr/bin/env bash
# Builds the game from src/ into two files:
#   index.html          standalone page (open it in a browser or serve it with GitHub Pages)
#   build/artifact.html same content without the html/head/body wrapper, for pasting into a claude.ai artifact
set -euo pipefail
cd "$(dirname "$0")"

JS_FILES=(src/js/core.js src/js/cards.js src/js/world-a.js src/js/world-b.js src/js/markets.js)

mkdir -p build

{
  cat src/head.html
  cat src/body.html
  echo '<script>'
  cat "${JS_FILES[@]}"
  echo '</script>'
} > build/artifact.html

{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  cat src/head.html
  printf '</head>\n<body>\n'
  cat src/body.html
  echo '<script>'
  cat "${JS_FILES[@]}"
  echo '</script>'
  printf '</body>\n</html>\n'
} > index.html

# syntax check the combined script
cat "${JS_FILES[@]}" > build/game.js
node --check build/game.js
echo "built index.html and build/artifact.html"
