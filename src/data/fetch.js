import { createWriteStream, existsSync, mkdirSync } from "fs";
import { get } from "https";
import { join } from "path";

const GAME_MASTER_ROOT =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/gamemaster/";

const localDir = join(import.meta.dirname, "pvpoke");
if (!existsSync(localDir)) {
  mkdirSync(localDir);
}

["moves.json", "pokemon.json"].forEach((filename) => {
  const path = join(localDir, filename);
  const file = createWriteStream(path);
  get(GAME_MASTER_ROOT + filename, (res) => res.pipe(file));
});
