const fs = require("fs");
const nunjucks = require("nunjucks");
const { join } = require("path");
const rimraf = require("rimraf");

const { getGameMaster } = require("./data/client");

const root = "docs";
rimraf.sync(root);

const views = join(__dirname, "views");
nunjucks.configure(views);

fs.mkdirSync(root);
fs.writeFileSync(join(root, ".nojekyll"), "");
fs.writeFileSync(join(root, "CNAME"), "www.pokemoves.com");

async function build() {
  const gameMaster = await getGameMaster();
  const html = await getHtml(gameMaster);
  fs.writeFileSync(join(root, "index.html"), html);
}

async function getHtml(gameMaster) {
  const pokemon = getTemplates(gameMaster, "pokemonSettings");
  const moves = getTemplates(gameMaster, "combatMove");
  const list = buildList(pokemon, moves);
  return nunjucks.render("list.njk", { list });
}

function getTemplates(gameMaster, property) {
  return gameMaster
    .filter(({ data }) => data[property])
    .map(({ data }) => data[property]);
}

function buildList(pokemon, moves) {
  const getMove = (id) => {
    const move = moves.find((m) => m.uniqueId === id);
    return {
      name: getMoveName(move),
      type: getMoveType(move),
      energy: getMoveEnergy(move),
    };
  };
  return pokemon.map((p) => {
    const name = p.form || p.pokemonId;
    const fastMoves = [
      ...(p.quickMoves || []),
      ...(p.eliteQuickMove || []),
    ].map(getMove);
    const chargedMoves = [
      ...(p.cinematicMoves || []),
      ...(p.eliteCinematicMove || []),
    ].map(getMove);
    const counts = fastMoves.map((fastMove) =>
      buildCounts(fastMove, chargedMoves)
    );
    return { name, counts };
  });
}

function buildCounts(fastMove, chargedMoves) {
  return {
    fastMove,
    chargedMoves: chargedMoves.map((chargedMove) => {
      return {
        ...chargedMove,
        counts: getCounts(fastMove, chargedMove),
      };
    }),
  };
}

function getMoveName(move) {
  return toSentenceCase(move.uniqueId.replace(/_FAST$/, ""));
}

function getMoveType(move) {
  return move.type.replace(/^POKEMON_TYPE_/, "").toLowerCase();
}

function getMoveEnergy(move) {
  return move.energyDelta;
}

function getCounts(fastMove, chargedMove) {
  const energy = fastMove.energy;
  const cost = -chargedMove.energy;
  const turns = Math.ceil(cost / energy);
  const savesTurn = (n) => (turns * n - 1) * energy >= cost * n;
  for (let n = 2; n <= 4; n++) {
    if (savesTurn(n)) {
      return Array(n - 1)
        .fill(turns)
        .concat([turns - 1]);
    }
  }
  return [turns];
}

function toSentenceCase(id) {
  return id
    .split("_")
    .map((word) => {
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
    .join(" ");
}

build();
