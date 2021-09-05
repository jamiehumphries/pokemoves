const fs = require("fs");
const nunjucks = require("nunjucks");
const { join } = require("path");
const rimraf = require("rimraf");

const { fetchGameMaster } = require("./data/client");
const { setEq } = require("./helpers/collections");
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
    turns: getMoveTurns(template),
  };
}

function buildList(pokemon, moves) {
  const getMove = (id) => moves.find((m) => m.id === id);
  return deduplicate(pokemon)
    .map((p) => {
      const name = p.name;
      const fastMoves = p.fastMoveIds
        .map(getMove)
        .sort(
          (m1, m2) => m1.turns - m2.turns || m1.name.localeCompare(m2.name)
        );
      const chargedMoves = p.chargedMoveIds
        .map(getMove)
        .sort(
          (m1, m2) => m2.energy - m1.energy || m1.name.localeCompare(m2.name)
        );
      const counts = fastMoves.map((fastMove) =>
        buildCounts(fastMove, chargedMoves)
      );
      return { name, counts };
    })
    .sort((p1, p2) => p1.name.localeCompare(p2.name));
}

function deduplicate(pokemon) {
  return pokemon.filter((pkm, i, arr) => {
    return (
      arr.findIndex(({ id, fastMoveIds, chargedMoveIds }) => {
        return (
          id === pkm.id &&
          setEq(fastMoveIds, pkm.fastMoveIds) &&
          setEq(chargedMoveIds, pkm.chargedMoveIds)
        );
      }) === i
    );
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

function getMoveTurns(template) {
  if (!template.uniqueId.endsWith("_FAST")) {
    return undefined;
  }
  return (template.durationTurns || 0) + 1;
}

function getCounts(fastMove, chargedMove) {
  const gain = fastMove.energy;
  const cost = -chargedMove.energy;
  const counts = [];
  let energy = 0;
  for (let n = 1; n <= 4; n++) {
    const count = Math.ceil((cost - energy) / gain);
    counts.push(count);
    energy += count * gain - cost;
  }
  return counts;
}

build();
