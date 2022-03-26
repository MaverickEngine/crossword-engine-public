#!/bin/sh

git clone git@github.com:MaverickEngine/crossword-engine.git
cp -a crossword-engine/includes .
cp crossword-engine/crosswordengine.php .
# cp crossword-engine/crosswordengine_constants.php .
cd crossword-engine
yarn
yarn run build:dev
yarn run build
cd ..
cp -a crossword-engine/dist .
rm -rf crossword-engine