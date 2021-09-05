const fs = require("fs");
const nunjucks = require("nunjucks");
const { join } = require("path");
const rimraf = require("rimraf");

const { fetchGameMaster } = require("./data/client");
const { getPokemonName, getMoveName } = require("./helpers/names");

const root = "docs";
rimraf.sync(root);

const views = join(__dirname, "views");
nunjucks.configure(views);

fs.mkdirSync(root);
fs.writeFileSync(join(root, ".nojekyll"), "");
fs.writeFileSync(join(root, "CNAME"), "www.pokemoves.com");

async function build() {
  const gameMaster = await fetchGameMaster();
  const html = await buildHtml(gameMaster);
  fs.writeFileSync(join(root, "index.html"), html);
}

async function buildHtml(gameMaster) {
  const pokemon = getTemplates(gameMaster, "pokemonSettings").map(buildPokemon);
  const moves = getTemplates(gameMaster, "combatMove").map(buildMove);
  const list = buildList(pokemon, moves);
  return nunjucks.render("list.njk", { list });
}

function getTemplates(gameMaster, property) {
  return gameMaster
    .filter(({ data }) => data[property])
    .map(({ data }) => data[property]);
}

function buildPokemon(template) {
  return {
    id: template.pokemonId,
    name: getPokemonName(template),
    fastMoveIds: getPokemonFastMoves(template),
    chargedMoveIds: getPokemonChargedMoves(template),
  };
}

function buildMove(template) {
  return {
    id: template.uniqueId,
    name: getMoveName(template),
    type: getMoveType(template),
    energy: getMoveEnergy(template),
  };
}

function buildList(pokemon, moves) {
  const getMove = (id) => moves.find((m) => m.id === id);
  return pokemon.map((p) => {
    const name = p.name;
    const fastMoves = p.fastMoveIds.map(getMove);
    const chargedMoves = p.chargedMoveIds.map(getMove);
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

function getPokemonFastMoves(template) {
  return [...(template.quickMoves || []), ...(template.eliteQuickMove || [])];
}

function getPokemonChargedMoves(template) {
  return [
    ...(template.cinematicMoves || []),
    ...(template.eliteCinematicMove || []),
    "RETURN",
  ];
}

function getMoveType(template) {
  return template.type.replace(/^POKEMON_TYPE_/, "").toLowerCase();
}

function getMoveEnergy(template) {
  return template.energyDelta;
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

build();
