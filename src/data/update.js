const https = require("https");
const fs = require("fs");
const { join } = require("path");

const GAME_MASTER =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json";

const path = join(__dirname, "latest.json");
const file = fs.createWriteStream(path);

https.get(GAME_MASTER, (res) => res.pipe(file));
