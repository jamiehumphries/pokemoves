import { createWriteStream, existsSync, mkdirSync } from "fs";
import { get } from "https";
import { join, parse } from "path";

const GAME_MASTER_ROOT =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/";

const localDir = join(import.meta.dirname, "pvpoke");
if (!existsSync(localDir)) {
  mkdirSync(localDir);
}

const paths = [
  "gamemaster/moves.json",
  "gamemaster/pokemon.json",
  "rankings/all/overall/rankings-500.json",
  "rankings/all/overall/rankings-1500.json",
  "rankings/all/overall/rankings-2500.json",
  "rankings/all/overall/rankings-10000.json",
];

for (const path of paths) {
  const { name, ext } = parse(path);
  const fullPath = join(localDir, name + ext);
  const file = createWriteStream(fullPath);
  get(GAME_MASTER_ROOT + path, (res) => res.pipe(file));
}
